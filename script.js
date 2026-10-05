const form = document.getElementById("creditForm");

const resultPlaceholder =
    document.getElementById("resultPlaceholder");

const resultContent =
    document.getElementById("resultContent");

const predictBtn =
    document.getElementById("predictBtn");

const buttonText =
    document.getElementById("buttonText");


form.addEventListener("submit", async function (event) {

    event.preventDefault();

    /* --------------------------------
       GET FORM VALUES
    -------------------------------- */

    const age =
        Number(document.getElementById("age").value);

    const income =
        Number(document.getElementById("income").value);

    const home =
        document.getElementById("home").value;

    const empLength =
        Number(document.getElementById("emp_length").value);

    const intent =
        document.getElementById("intent").value;

    const grade =
        document.getElementById("grade").value;

    const amount =
        Number(document.getElementById("amount").value);

    const rate =
        Number(document.getElementById("rate").value);

    const percent =
        Number(document.getElementById("percent").value);

    const previousDefault =
        document.getElementById("default").value;

    const history =
        Number(document.getElementById("history").value);


    /* --------------------------------
       BASIC VALIDATION
    -------------------------------- */

    if (age <= 0) {
        alert("Please enter a valid age.");
        return;
    }

    if (income <= 0) {
        alert("Please enter a valid income.");
        return;
    }

    if (amount <= 0) {
        alert("Please enter a valid loan amount.");
        return;
    }

    if (percent < 0 || percent > 1) {
        alert("Loan / Income Ratio must be between 0 and 1.");
        return;
    }


    /* --------------------------------
       SHOW AI LOADING
    -------------------------------- */

    predictBtn.classList.add("loading");

    buttonText.innerHTML =
        "🤖 AI Analyzing...";


    /* --------------------------------
       REQUEST DATA
    -------------------------------- */

    const data = {

        person_age: age,

        person_income: income,

        person_home_ownership: home,

        person_emp_length: empLength,

        loan_intent: intent,

        loan_grade: grade,

        loan_amnt: amount,

        loan_int_rate: rate,

        loan_percent_income: percent,

        cb_person_default_on_file: previousDefault,

        cb_person_cred_hist_length: history
    };


    try {

        /* --------------------------------
           CALL FASTAPI
        -------------------------------- */

        const response = await fetch(
            "https://credit-risk-prediction-y8j8.onrender.com/predict",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        /* --------------------------------
           READ RESPONSE
        -------------------------------- */

        const text =
            await response.text();

        console.log(
            "API Status:",
            response.status
        );

        console.log(
            "API Response:",
            text
        );


        if (!text) {

            throw new Error(
                "Backend returned an empty response."
            );

        }


        let result;

        try {

            result = JSON.parse(text);

        } catch {

            throw new Error(
                "Backend returned invalid JSON:\n" +
                text
            );

        }


        if (!response.ok) {

            let message =
                "Prediction failed.";

            if (result.detail) {

                message =
                    typeof result.detail === "string"
                        ? result.detail
                        : JSON.stringify(result.detail);

            }

            throw new Error(message);

        }


        /* --------------------------------
           DISPLAY RESULT
        -------------------------------- */

        showResult(result);


    } catch (error) {

        console.error(error);

        alert(
            "❌ Error:\n\n" +
            error.message
        );

    } finally {

        predictBtn.classList.remove("loading");

        buttonText.innerHTML =
            "Analyze Credit Risk";

    }

});


/* ==========================================
   SHOW RESULT
========================================== */

function showResult(result) {

    resultPlaceholder.style.display =
        "none";

    resultContent.classList.add("show");


    /* --------------------------------
       PROBABILITY
    -------------------------------- */

    const probability =
        Number(result.default_probability);

    document.getElementById(
        "probability"
    ).textContent =
        probability.toFixed(2) + "%";


    /* --------------------------------
       BASIC RESULT
    -------------------------------- */

    document.getElementById(
        "prediction"
    ).textContent =
        result.prediction_label;

    document.getElementById(
        "riskText"
    ).textContent =
        result.risk_level;

    document.getElementById(
        "recommendation"
    ).textContent =
        result.recommendation;


    /* --------------------------------
       RISK BADGE
    -------------------------------- */

    const riskBadge =
        document.getElementById("riskLevel");

    riskBadge.textContent =
        result.risk_level;


    /* --------------------------------
       RISK COLORS
    -------------------------------- */

    if (result.risk_level === "Low Risk") {

        riskBadge.style.color =
            "#4ade80";

        riskBadge.style.background =
            "rgba(34,197,94,0.12)";

    }

    else if (
        result.risk_level === "Medium Risk"
    ) {

        riskBadge.style.color =
            "#facc15";

        riskBadge.style.background =
            "rgba(250,204,21,0.12)";

    }

    else {

        riskBadge.style.color =
            "#f87171";

        riskBadge.style.background =
            "rgba(239,68,68,0.12)";

    }


    /* --------------------------------
       AI EXPLANATION
    -------------------------------- */

    generateExplanation();


    /* --------------------------------
       RISK FACTORS
    -------------------------------- */

    generateRiskFactors();


    /* --------------------------------
       POSITIVE FACTORS
    -------------------------------- */

    generatePositiveFactors();

}


/* ==========================================
   AI EXPLANATION
========================================== */

function generateExplanation() {

    const loanAmount =
        Number(
            document.getElementById("amount").value
        );

    const income =
        Number(
            document.getElementById("income").value
        );

    const rate =
        Number(
            document.getElementById("rate").value
        );

    const ratio =
        Number(
            document.getElementById("percent").value
        );

    const previousDefault =
        document.getElementById("default").value;

    const grade =
        document.getElementById("grade").value;

    let explanation =
        "The AI model evaluated the applicant's financial profile using multiple credit-related features.";

    if (ratio > 0.4) {

        explanation =
            "The applicant has a relatively high loan-to-income ratio, which increases the estimated repayment burden.";

    }

    else if (rate > 15) {

        explanation =
            "The interest rate is relatively high, which may increase the overall repayment burden for the applicant.";

    }

    else if (previousDefault === "Y") {

        explanation =
            "A previous credit default was reported, which is an important factor considered in the risk assessment.";

    }

    else if (
        grade === "E" ||
        grade === "F" ||
        grade === "G"
    ) {

        explanation =
            "The loan grade indicates elevated credit risk compared with higher-grade applicants.";

    }

    else if (
        loanAmount > income * 0.4
    ) {

        explanation =
            "The requested loan amount is relatively large compared with annual income.";

    }

    else {

        explanation =
            "The applicant's overall financial profile was evaluated using income, employment, loan characteristics and credit history.";

    }

    document.getElementById(
        "explanationText"
    ).textContent = explanation;

}


/* ==========================================
   RISK FACTORS
========================================== */

function generateRiskFactors() {

    const container =
        document.getElementById(
            "riskFactors"
        );

    container.innerHTML = "";


    const ratio =
        Number(
            document.getElementById("percent").value
        );

    const rate =
        Number(
            document.getElementById("rate").value
        );

    const previousDefault =
        document.getElementById("default").value;

    const grade =
        document.getElementById("grade").value;


    let factors = [];


    if (ratio > 0.4) {

        factors.push({
            name: "High Loan / Income Ratio",
            value: 90
        });

    }

    else if (ratio > 0.25) {

        factors.push({
            name: "Moderate Loan / Income Ratio",
            value: 60
        });

    }


    if (rate > 15) {

        factors.push({
            name: "High Interest Rate",
            value: 85
        });

    }

    else if (rate > 12) {

        factors.push({
            name: "Elevated Interest Rate",
            value: 60
        });

    }


    if (previousDefault === "Y") {

        factors.push({
            name: "Previous Default Detected",
            value: 95
        });

    }


    if (
        grade === "E" ||
        grade === "F" ||
        grade === "G"
    ) {

        factors.push({
            name: "Lower Loan Grade",
            value: 80
        });

    }


    if (factors.length === 0) {

        factors.push({
            name: "No major risk factor detected",
            value: 25
        });

    }


    factors.forEach(
        factor => {

            const element =
                document.createElement("div");

            element.className =
                "factor";

            element.innerHTML = `

                <div class="factor-label">

                    <span>
                        ${factor.name}
                    </span>

                    <span>
                        ${factor.value}%
                    </span>

                </div>

                <div class="factor-bar">

                    <div
                        class="factor-fill risk"
                        style="width:${factor.value}%"
                    ></div>

                </div>

            `;

            container.appendChild(element);

        }
    );

}


/* ==========================================
   POSITIVE FACTORS
========================================== */

function generatePositiveFactors() {

    const container =
        document.getElementById(
            "positiveFactors"
        );

    container.innerHTML = "";


    const income =
        Number(
            document.getElementById("income").value
        );

    const empLength =
        Number(
            document.getElementById("emp_length").value
        );

    const history =
        Number(
            document.getElementById("history").value
        );

    const previousDefault =
        document.getElementById("default").value;


    let factors = [];


    if (income >= 500000) {

        factors.push({
            name: "Strong Annual Income",
            value: 75
        });

    }


    if (empLength >= 3) {

        factors.push({
            name: "Stable Employment",
            value: 70
        });

    }


    if (history >= 5) {

        factors.push({
            name: "Long Credit History",
            value: 75
        });

    }


    if (previousDefault === "N") {

        factors.push({
            name: "No Previous Default",
            value: 85
        });

    }


    if (factors.length === 0) {

        factors.push({
            name: "Limited positive indicators",
            value: 25
        });

    }


    factors.forEach(
        factor => {

            const element =
                document.createElement("div");

            element.className =
                "factor";

            element.innerHTML = `

                <div class="factor-label">

                    <span>
                        ${factor.name}
                    </span>

                    <span>
                        ${factor.value}%
                    </span>

                </div>

                <div class="factor-bar">

                    <div
                        class="factor-fill positive"
                        style="width:${factor.value}%"
                    ></div>

                </div>

            `;

            container.appendChild(element);

        }
    );

}