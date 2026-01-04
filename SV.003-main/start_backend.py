
import os
import subprocess
import sys

def install_dependencies():
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"])
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)

def run_backend():
    try:
        os.chdir("backend")
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--reload"])
    except FileNotFoundError:
        print("Error: 'backend' directory not found.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error running backend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    install_dependencies()
    run_backend()
