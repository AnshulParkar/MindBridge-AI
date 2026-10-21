# services/ml_classifier.py
from transformers import pipeline
from functools import lru_cache

@lru_cache(maxsize=1)
def get_classifier():
    return pipeline(
        "text-classification",
        model="./mental_health_model/final",
        tokenizer="./mental_health_model/final",
        device=-1  # -1 = CPU, 0 = GPU
    )

def classify_severity(text: str) -> dict:
    classifier = get_classifier()
    
    # Truncate if needed — BERT has 512 token limit
    if len(text) > 1000:
        text = text[-1000:]  # Use most recent content
    
    result = classifier(text)[0]
    label_to_level = {
        "LABEL_0": 1, "LABEL_1": 2, "LABEL_2": 3,
        "LABEL_3": 4, "LABEL_4": 5
    }
    
    return {
        "level": label_to_level[result["label"]],
        "confidence": round(result["score"], 3),
        "method": "ml_classifier"
    }