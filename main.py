from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import joblib


# --------------------------------------------------
# Load trained model and metadata
# --------------------------------------------------

model_pipeline = joblib.load("credit_risk_pipeline.pkl")
model_metadata = joblib.load("model_metadata.pkl")


# --------------------------------------------------
# Create FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="Credit Risk Prediction API",
    description="API for predicting loan default risk using XGBoost",
    version="1.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Input Data Model
# --------------------------------------------------

class CreditRiskInput(BaseModel):

    person_age: float = Field(..., gt=0)
    person_income: float = Field(..., gt=0)

    person_home_ownership: str
    person_emp_length: float = Field(..., ge=0)

    loan_intent: str
    loan_grade: str

    loan_amnt: float = Field(..., gt=0)
    loan_int_rate: float = Field(..., gt=0)

    loan_percent_income: float = Field(..., ge=0, le=1)

    cb_person_default_on_file: str

    cb_person_cred_hist_length: float = Field(..., gt=0)


# --------------------------------------------------
# Home Route
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "Credit Risk Prediction API is running",
        "model": model_metadata.get(
            "model_name",
            "XGBoost Credit Risk Classifier"
        ),
        "version": model_metadata.get("version", "1.0")
    }


# --------------------------------------------------
# Prediction Route
# --------------------------------------------------

@app.post("/predict")
def predict_credit_risk(data: CreditRiskInput):

    # ----------------------------------------------
    # Convert input into dictionary
    # ----------------------------------------------

    input_data = data.model_dump()

    # ----------------------------------------------
    # Create feature engineering variables
    # Same as your Colab notebook
    # ----------------------------------------------

    input_data["foir"] = input_data["loan_percent_income"]

    input_data["income_to_age"] = (
        input_data["person_income"] /
        input_data["person_age"]
    )

    # ----------------------------------------------
    # Create DataFrame
    # ----------------------------------------------

    df = pd.DataFrame([input_data])

    # ----------------------------------------------
    # Predict probability
    # ----------------------------------------------

    probability = model_pipeline.predict_proba(df)[0][1]

    # ----------------------------------------------
    # Prediction using threshold = 0.50
    # ----------------------------------------------

    threshold = model_metadata.get(
        "optimal_threshold",
        0.50
    )

    prediction = 1 if probability >= threshold else 0

    # ----------------------------------------------
    # Risk classification
    # ----------------------------------------------

    if probability < 0.20:

        risk_level = "Low Risk"
        recommendation = "Auto-Approve"

    elif probability <= 0.50:

        risk_level = "Medium Risk"
        recommendation = "Manual Review"

    else:

        risk_level = "High Risk"
        recommendation = "Auto-Reject"

    # ----------------------------------------------
    # Final response
    # ----------------------------------------------

    return {
        "prediction": prediction,

        "prediction_label": (
            "Default Risk"
            if prediction == 1
            else "Non-Default Risk"
        ),

        "default_probability": round(
            float(probability) * 100,
            2
        ),

        "risk_level": risk_level,

        "recommendation": recommendation
    }


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "model_loaded": True
    }
