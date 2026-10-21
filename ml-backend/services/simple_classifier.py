# services/simple_classifier.py
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import joblib

def train_simple_classifier(texts: list[str], labels: list[int]):
    """
    texts: list of chat session texts
    labels: list of severity levels (1-5)
    """
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 3),      # Unigrams, bigrams, trigrams
            max_features=10000,
            sublinear_tf=True,       # Log normalization
            stop_words="english"
        )),
        ("clf", LogisticRegression(
            C=1.0, 
            class_weight="balanced", # Critical for imbalanced mental health data
            max_iter=1000
        ))
    ])
    
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, stratify=labels
    )
    
    pipe.fit(X_train, y_train)
    print(f"Test accuracy: {pipe.score(X_test, y_test):.3f}")
    
    joblib.dump(pipe, "simple_mental_health_clf.pkl")
    return pipe