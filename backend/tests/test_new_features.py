"""
Backend API Test Suite for New Features
Tests: 4km PB, medals system, profile edit, Strava integration
"""
import pytest
import requests

BASE_URL = "https://mezzofondo-training.preview.emergentagent.com"

class TestProfileChanges:
    """Test profile with 4km PB instead of 5km"""

    def test_profile_shows_4km_pb(self):
        """Test GET /api/profile returns 4km PB with correct data"""
        response = requests.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 200, f"Profile failed with status {response.status_code}"
        
        data = response.json()
        assert 'pbs' in data, "Profile missing PBs"
        
        pbs = data['pbs']
        # Verify 4km PB exists
        assert '4km' in pbs, "Missing 4km PB - should have replaced 5km"
        
        # Verify 4km PB data
        pb_4km = pbs['4km']
        assert pb_4km['time'] == "16:08", f"4km time should be 16:08, got {pb_4km['time']}"
        assert pb_4km['pace'] == "4:01", f"4km pace should be 4:01, got {pb_4km['pace']}"
        assert pb_4km['date'] == "2025-09-20", f"4km date should be 2025-09-20, got {pb_4km['date']}"
        
        # Verify 5km doesn't exist (replaced by 4km)
        assert '5km' not in pbs, "5km PB should be removed (replaced with 4km)"
        
        print(f"✓ Profile shows 4km PB: {pb_4km['time']} ({pb_4km['pace']}/km)")

    def test_profile_update_age_weight(self):
        """Test PATCH /api/profile updates age and weight correctly"""
        # Get current profile
        get_response = requests.get(f"{BASE_URL}/api/profile")
        assert get_response.status_code == 200
        original = get_response.json()
        original_age = original.get('age')
        original_weight = original.get('weight_kg')
        
        # Update age and weight
        updates = {
            "age": 41,
            "weight_kg": 69.5
        }
        
        patch_response = requests.patch(f"{BASE_URL}/api/profile", json=updates)
        assert patch_response.status_code == 200, f"Profile update failed with status {patch_response.status_code}"
        
        updated = patch_response.json()
        assert updated['age'] == 41, f"Age should be 41, got {updated['age']}"
        assert updated['weight_kg'] == 69.5, f"Weight should be 69.5, got {updated['weight_kg']}"
        
        # Verify persistence with GET
        verify_response = requests.get(f"{BASE_URL}/api/profile")
        verify_data = verify_response.json()
        assert verify_data['age'] == 41, "Age update not persisted"
        assert verify_data['weight_kg'] == 69.5, "Weight update not persisted"
        
        # Restore original values
        restore_payload = {
            "age": original_age,
            "weight_kg": original_weight
        }
        restore_response = requests.patch(f"{BASE_URL}/api/profile", json=restore_payload)
        assert restore_response.status_code == 200, "Failed to restore original values"
        
        print(f"✓ Profile update working: age {original_age}→41→{original_age}, weight {original_weight}→69.5→{original_weight}")


class TestMedalsSystem:
    """Test medals endpoint with gold targets and gap calculation"""

    def test_get_medals_structure(self):
        """Test GET /api/medals returns 5 medal distances"""
        response = requests.get(f"{BASE_URL}/api/medals")
        assert response.status_code == 200, f"Medals failed with status {response.status_code}"
        
        data = response.json()
        assert 'medals' in data, "Response missing medals"
        
        medals = data['medals']
        # Should have 5 distances: 4km, 6km, 10km, 15km, 21.1km
        expected_distances = ['4km', '6km', '10km', '15km', '21.1km']
        
        for dist in expected_distances:
            assert dist in medals, f"Missing {dist} medal"
        
        assert len(medals) == 5, f"Expected 5 medal distances, got {len(medals)}"
        
        print(f"✓ Medals endpoint returns 5 distances: {list(medals.keys())}")

    def test_medals_gold_targets(self):
        """Test medals contain gold targets and pace"""
        response = requests.get(f"{BASE_URL}/api/medals")
        data = response.json()
        medals = data['medals']
        
        # Verify each medal has required fields
        for dist, medal in medals.items():
            assert 'gold_target' in medal, f"{dist} missing gold_target"
            assert 'gold_pace' in medal, f"{dist} missing gold_pace"
            assert 'status' in medal, f"{dist} missing status"
            
            # Verify status is one of: gold, silver, locked
            assert medal['status'] in ['gold', 'silver', 'locked'], f"{dist} has invalid status: {medal['status']}"
            
            print(f"  {dist}: target={medal['gold_target']}, pace={medal['gold_pace']}/km, status={medal['status']}")
        
        print(f"✓ All medals have gold_target, gold_pace, and status")

    def test_medals_gap_calculation(self):
        """Test medals with silver status show gap_seconds"""
        response = requests.get(f"{BASE_URL}/api/medals")
        data = response.json()
        medals = data['medals']
        
        silver_medals = {dist: medal for dist, medal in medals.items() if medal['status'] == 'silver'}
        
        if len(silver_medals) > 0:
            for dist, medal in silver_medals.items():
                assert 'gap_seconds' in medal, f"Silver medal {dist} missing gap_seconds"
                assert isinstance(medal['gap_seconds'], (int, float)), f"{dist} gap_seconds should be numeric"
                assert medal['gap_seconds'] > 0, f"{dist} gap_seconds should be positive (need to improve)"
                
                gap_mins = medal['gap_seconds'] // 60
                gap_secs = medal['gap_seconds'] % 60
                print(f"  {dist}: needs to improve by {gap_mins}:{gap_secs:02d} to reach gold")
            
            print(f"✓ Gap calculation working for {len(silver_medals)} silver medals")
        else:
            print(f"⚠ No silver medals found (all gold or locked)")


class TestStravaIntegration:
    """Test Strava API integration"""

    def test_strava_profile_connected(self):
        """Test GET /api/strava/profile returns connected user"""
        response = requests.get(f"{BASE_URL}/api/strava/profile")

        # Should return 200 if token is valid
        if response.status_code == 200:
            data = response.json()
            assert 'name' in data, "Strava profile missing name"
            assert 'connected' in data, "Strava profile missing connected status"
            assert data['connected'] == True, "Strava should be connected"

            # Verify a valid name is returned
            assert len(data['name']) > 0, f"Expected a valid name, got empty string"

            print(f"✓ Strava profile connected: {data['name']}")
        elif response.status_code == 400:
            pytest.skip("Strava token not configured - expected in some environments")
        else:
            raise AssertionError(f"Unexpected status {response.status_code}: {response.text}")

    def test_strava_activities_scope_limitation(self):
        """Test GET /api/strava/activities returns needs_reauth=true due to scope"""
        response = requests.get(f"{BASE_URL}/api/strava/activities")
        
        if response.status_code == 200:
            data = response.json()
            
            # Should have needs_reauth flag
            assert 'needs_reauth' in data, "Response missing needs_reauth field"
            
            # Should be True because we need activity:read scope
            assert data['needs_reauth'] == True, f"Expected needs_reauth=true (scope limitation), got {data['needs_reauth']}"
            
            # Should have error message about scope
            if 'error' in data:
                assert 'activity:read' in data['error'] or 'Scope' in data['error'], "Error message should mention activity:read scope"
            
            # Activities should be empty or minimal
            activities = data.get('activities', [])
            
            print(f"✓ Strava activities returns needs_reauth=true (scope limitation as expected)")
        elif response.status_code == 400:
            pytest.skip("Strava token not configured - expected in some environments")
        else:
            raise AssertionError(f"Unexpected status {response.status_code}: {response.text}")

    def test_strava_sync_returns_scope_message(self):
        """Test POST /api/strava/sync returns scope message"""
        response = requests.post(f"{BASE_URL}/api/strava/sync")
        
        if response.status_code == 200:
            data = response.json()
            
            # Should have needs_reauth or message about scope
            if 'needs_reauth' in data and data['needs_reauth'] == True:
                assert 'message' in data or 'error' in data, "Should have message explaining scope issue"
                message = data.get('message') or data.get('error', '')
                assert 'activity:read' in message or 'Scope' in message, "Message should mention activity:read scope"
                print(f"✓ Strava sync returns scope message: {message}")
            else:
                # If sync worked, that's also fine
                assert 'synced' in data, "Response missing synced count"
                print(f"✓ Strava sync working: {data['synced']} activities synced")
        elif response.status_code == 400:
            pytest.skip("Strava token not configured - expected in some environments")
        else:
            raise AssertionError(f"Unexpected status {response.status_code}: {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
