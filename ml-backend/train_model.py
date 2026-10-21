# train_model.py
from datasets import load_dataset
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    TrainingArguments, 
    Trainer
)
import numpy as np
from sklearn.metrics import accuracy_score, f1_score

# Labels matching your MENTAL_HEALTH_LEVELS (1-5)
# Map dataset labels to your 5-level severity scale
LABEL_MAP = {
    "no_mental_health": 0,   # Level 1 - Minimal
    "mild": 1,               # Level 2 - Mild  
    "moderate": 2,           # Level 3 - Moderate
    "severe": 3,             # Level 4 - Moderately Severe
    "crisis": 4              # Level 5 - Severe
}

MODEL_NAME = "mental-health/MentalBERT"  # or "distilbert-base-uncased"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, 
    num_labels=5
)

# Load and preprocess your dataset
dataset = load_dataset("mrm8488/mental_health_classification")

def preprocess(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding="max_length",
        max_length=256
    )

tokenized = dataset.map(preprocess, batched=True)

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1_macro": f1_score(labels, preds, average="macro")
    }

training_args = TrainingArguments(
    output_dir="./mental_health_model",
    num_train_epochs=4,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    warmup_steps=200,
    weight_decay=0.01,
    evaluation_strategy="epoch",
    save_strategy="best",
    load_best_model_at_end=True,
    metric_for_best_model="f1_macro"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized["train"],
    eval_dataset=tokenized["validation"],
    compute_metrics=compute_metrics
)

trainer.train()
trainer.save_model("./mental_health_model/final")