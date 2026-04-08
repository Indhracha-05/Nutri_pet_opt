
import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_root():
    try:
        req = urllib.request.Request(f"{BASE_URL}/")
        with urllib.request.urlopen(req) as response:
            print(f"GET /: {response.status}")
            data = json.loads(response.read().decode())
            print(data)
            return response.status == 200
    except Exception as e:
        print(f"Server not running? {e}")
        return False

def test_analyze(species, food, expected_grade=None):
    print(f"\n--- Testing: {species} + {food} ---")
    url = f"{BASE_URL}/analyze"
    payload = json.dumps({"species_name": species, "food_name": food}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                grade = data.get("health_grade")
                is_toxic = data.get("is_toxic")
                print(f"✅ Success! Grade: {grade}, Toxic: {is_toxic}")
                print(f"Explanation: {data.get('explanation_text')[:100]}...")
                if expected_grade and grade != expected_grade:
                    print(f"⚠️ Warning: Expected {expected_grade}, got {grade}")
            else:
                print(f"❌ Failed: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"❌ Failed: {e.code}")
        print(e.read().decode())
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    if not test_root():
        sys.exit(1)
    
    # Test 1: Cat + Chicken Breast (Should be Good, Grade A or B)
    test_analyze("Cat", "Chicken Breast", "A")
    
    # Test 2: Dog + Chocolate (Dark) (Should be Toxic/F)
    test_analyze("Dog", "Chocolate (Dark)", "F")
    
    # Test 3: Rabbit + Beef (Should be bad - Herbivore eating meat)
    test_analyze("Rabbit", "Beef (Ground 85%)", "D")

if __name__ == "__main__":
    main()
