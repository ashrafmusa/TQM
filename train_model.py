from sklearn.linear_model import LinearRegression
import joblib
import os

# Simple Sample Data (Replace with relevant data if building a real model)
X = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]]
y = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5]

print("Training a simple Linear Regression model...")
model = LinearRegression()
try:
    model.fit(X, y)
    print("Model trained successfully!")
    model_filename = 'defect_reduction_model.pkl'
    save_path = os.path.join(os.path.dirname(__file__), model_filename)
    joblib.dump(model, save_path)
    print(f"Model saved as '{model_filename}' in the project root directory.")

    print("\nVerifying saved model...")
    loaded_model = joblib.load(save_path)
    test_input = [[7, 8]] # Example input
    prediction = loaded_model.predict(test_input)
    print(f"Prediction for input {test_input}: {prediction[0]:.2f}")
    print("Verification complete.")

except Exception as e:
    print(f"\nAn error occurred during training or saving: {e}")