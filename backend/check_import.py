import sys
import os

# Add backend directory to path
sys.path.append(os.getcwd())

try:
    from app import main
    print("Successfully imported app.main")
except Exception as e:
    print(f"Failed to import app.main: {e}")
    import traceback
    traceback.print_exc()
