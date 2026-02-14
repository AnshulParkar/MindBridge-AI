import os
import asyncio
import logging
from dotenv import load_dotenv
from groq import Groq

# Load .env variables
load_dotenv()

# Get API key
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("❌ GROQ_API_KEY is not set in environment variables!")

# Initialize Groq client
client = Groq(api_key=api_key)

# System prompt (same as your Groq version)
SYSTEM_PROMPT = """
You are a supportive, non-clinical mental health assistant for college students. 
Your goals:
1. Act like a therapist: listen empathetically, ask reflective questions, build on prior conversations, and guide students through their emotions.
2. Provide stress management, mindfulness, positive self-talk, and healthy coping strategies.
3. Encourage journaling, exercise, rest, and social connection when relevant.
4. If a student shows heavy distress (e.g., extreme hopelessness, self-harm, or suicidal thoughts) AND you cannot help through conversation, then and only then gently suggest professional counselling.
5. Never act like a doctor or prescribe medication.
6. Keep tone: warm, conversational, supportive — like a peer counselor, not a generic chatbot.
7. Always validate the student’s feelings before offering suggestions.
8. Your style:
- Speak like a caring therapist, not like a rigid Q&A bot.
- Acknowledge feelings first, then gently explore with short, open-ended questions.
- Use grounding techniques, affirmations, and coping strategies.
- Maintain context from earlier in the conversation.
- Only suggest counselling if user seems very distressed or at risk of self-harm.
- Keep responses natural, warm, and 3–6 sentences long.
"""

# Conversation history to maintain context
conversation_history = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

# Main function to use in UI (same interface as before)
def get_bot_reply(user_message: str) -> str:
    """
    Takes a user message, sends it to Groq, returns the reply.
    Preserves conversation history within the session.
    """
    global conversation_history
    
    try:
        # Add user message to history
        conversation_history.append({"role": "user", "content": user_message})
        
        # Call Groq API with full history
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=conversation_history,
            max_tokens=300,
            temperature=0.7
        )
        
        bot_message = response.choices[0].message.content
        
        # Add bot reply to history
        conversation_history.append({"role": "assistant", "content": bot_message})
        
        return bot_message.strip()
    except Exception as e:
        return f"❌ Groq Error: {str(e)}"

class GroqService:
    """
    Groq-powered AI service for therapy responses with RAG integration
    """
    
    def __init__(self):
        self.conversation_history = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
        
        # Initialize RAG components with proper error handling
        self.retriever = None
        self.rag_enabled = False
        try:
            print("🔄 Initializing RAG system...")
            
            # Import RAG dependencies only if they exist
            import sys
            sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
            
            from rag.helper import download_hugging_face_embeddings
            from langchain_pinecone import PineconeVectorStore
            
            # Check if Pinecone API key is set
            pinecone_key = os.getenv("PINECONE_API_KEY")
            if not pinecone_key:
                raise ValueError("PINECONE_API_KEY not set")
            
            # Initialize embeddings and retriever
            embeddings = download_hugging_face_embeddings()
            self.retriever = PineconeVectorStore.from_existing_index(
                index_name="healthai",
                embedding=embeddings
            ).as_retriever(search_kwargs={"k": 3})  # Retrieve top 3 relevant documents
            print("✅ RAG system initialized successfully")
            self.rag_enabled = True
        except ImportError as e:
            print(f"⚠️ RAG dependencies not installed: {str(e)}")
            print("⚠️ Install with: pip install -r rag/requirements.txt")
            print("⚠️ Continuing without RAG (conversation history still works)")
        except ValueError as e:
            print(f"⚠️ RAG configuration missing: {str(e)}")
            print("⚠️ Set PINECONE_API_KEY in .env file")
            print("⚠️ Continuing without RAG (conversation history still works)")
        except Exception as e:
            print(f"⚠️ RAG initialization failed: {str(e)}")
            print("⚠️ Continuing without RAG (conversation history still works)")

    async def test_connection(self):
        """Test Groq API connection"""
        try:
            # Simple test prompt
            response = await self.generate_therapy_response("Hello, this is a test.")
            print(f"✅ Groq API connection successful")
            return True
        except Exception as e:
            print(f"❌ Groq connection test failed: {str(e)}")
            return False
    
    async def generate_therapy_response(self, user_message: str, emotion: str = "neutral") -> str:
        """
        Generate therapeutic response using Groq API with RAG enhancement
        
        Args:
            user_message: The user's message
            emotion: Detected emotion (currently not used but kept for compatibility)
            
        Returns:
            AI-generated therapeutic response augmented with relevant knowledge
        """
        try:
            # Prepare the message (with or without RAG)
            message_to_send = user_message
            
            # RAG: Retrieve relevant context if available
            if self.rag_enabled and self.retriever:
                try:
                    # Retrieve relevant documents from Pinecone
                    loop = asyncio.get_event_loop()
                    context_docs = await loop.run_in_executor(None, self.retriever.invoke, user_message)
                    
                    if context_docs and len(context_docs) > 0:
                        # Extract content from retrieved documents
                        context = "\n".join([doc.page_content for doc in context_docs])
                        
                        # Augment user message with retrieved context
                        message_to_send = f"""[Context from mental health knowledge base: {context}]

User's question: {user_message}

Please provide a therapeutic response based on the context above and your expertise."""
                        print(f"✅ RAG: Retrieved {len(context_docs)} relevant documents")
                    else:
                        print("⚠️ RAG: No relevant documents found, using conversation history only")
                except Exception as rag_error:
                    print(f"⚠️ RAG retrieval failed: {str(rag_error)}. Continuing without RAG.")
                    # Continue with original message if RAG fails
            
            # Add user message to history (with or without RAG context)
            self.conversation_history.append({"role": "user", "content": message_to_send})
            
            # Call Groq API with full history
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=self.conversation_history,
                max_tokens=300,
                temperature=0.7
            ))
            
            bot_message = response.choices[0].message.content
            
            # Add bot reply to history
            self.conversation_history.append({"role": "assistant", "content": bot_message})
            
            return bot_message.strip()
        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            print(f"❌ {error_msg}")
            return f"I apologize, but I'm having trouble processing your request right now. Please try again."

# Optional: test from terminal
if __name__ == "__main__":
    print("Groq Health-Bot is running. Type 'exit' to quit.\n")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("Bot: Take care! Ending the session now.")
            break
        reply = get_bot_reply(user_input)
        print("Bot:", reply)


# Terminal Chat Interface for Groq
async def main():
    """Run interactive terminal chat with AI therapist using Groq"""
    import asyncio
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    # Check if API key is set
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ Error: GROQ_API_KEY environment variable not set!")
        print("Please set your Groq API key:")
        print("export GROQ_API_KEY='your-api-key-here'")
        return
    
    # Mask API key for display
    masked_key = f"{api_key[:10]}...{api_key[-4:]}" if len(api_key) > 14 else "***"
    
    # Initialize the service
    print("🤖 AI Therapist Terminal Chat (Powered by Groq)")
    print("=" * 70)
    print(f"🔑 API Key: {masked_key}")
    print("🆓 Using FREE Groq API")
    print("💡 Type 'quit', 'exit', or 'bye' to end the chat")
    print("💡 You can specify emotion like: 'sad: I'm feeling down today'")
    print("💡 Valid emotions: happy, sad, angry, fearful, surprised, disgusted, neutral")
    print("=" * 70)

    service = GroqService()

    # Test connection first
    print("\n🔍 Testing Groq API connection...")
    connection_success = await service.test_connection()
    
    if not connection_success:
        print("⚠️  API connection failed, continuing with fallback responses only...")
    else:
        print("✅ Connected successfully to Gemini API!")
    
    print("\n🚀 Chat started!")
    
    while True:
        try:
            # Get user input
            user_input = input("\n💬 You: ").strip()
            
            # Check for exit commands
            if user_input.lower() in ['quit', 'exit', 'bye', 'q']:
                print("\n👋 Goodbye! Take care of yourself.")
                break
            
            if not user_input:
                continue
            
            # Parse emotion if provided (format: "emotion: message")
            emotion = "neutral"
            message = user_input
            
            if ":" in user_input and len(user_input.split(":", 1)) == 2:
                potential_emotion, potential_message = user_input.split(":", 1)
                potential_emotion = potential_emotion.strip().lower()
                
                # Check if it's a valid emotion
                valid_emotions = ["happy", "sad", "angry", "fearful", "surprised", "disgusted", "neutral"]
                if potential_emotion in valid_emotions:
                    emotion = potential_emotion
                    message = potential_message.strip()
            
            # Show processing indicator
            print(f"\n🤔 AI Therapist (detected emotion: {emotion}): Thinking...")
            
            # Generate response
            response = await service.generate_therapy_response(message, emotion)
            
            # Display response
            print(f"\n🤖 AI Therapist: {response}")
            
        except KeyboardInterrupt:
            print("\n\n👋 Chat interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            print("Please try again or type 'quit' to exit.")

# if __name__ == "__main__":
#     import asyncio
#     asyncio.run(main())