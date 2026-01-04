
import os
import subprocess
import sys

def install_dependencies():
    try:
        os.chdir("frontend")
        subprocess.check_call(["npm", "install"])
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)
    finally:
        os.chdir("..")

def run_frontend():
    try:
        os.chdir("frontend")
        subprocess.run(["npm", "start"])
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Error running frontend: {e}")
        sys.exit(1)
    finally:
        os.chdir("..")

if __name__ == "__main__":
    install_dependencies()
    run_frontend()
