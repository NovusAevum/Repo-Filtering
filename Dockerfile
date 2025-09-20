# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code into the container at /app
COPY . .

# Set environment variables for API keys
# It's recommended to pass these at runtime, but you can set defaults here
# ENV SERPAPI_API_KEY="your_key_here"
# ENV GITHUB_TOKEN="your_token_here"

# Command to run the application
ENTRYPOINT ["python", "-m", "replit_finder"]
