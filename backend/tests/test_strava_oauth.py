"""
Backend API Test Suite for Strava OAuth Flow
Tests: auth-url generation, code exchange endpoint, token storage, profile access
"""
import pytest
import requests

BASE_URL = "https://mezzofondo-training.preview.emergentagent.com"

class TestStravaOAuthFlow:
    """Test complete Strava OAuth authorization flow"""

    def test_strava_auth_url_endpoint(self):
        """Test GET /api/strava/auth-url returns correct OAuth URL with activity:read_all scope"""
        response = requests.get(f"{BASE_URL}/api/strava/auth-url")
        assert response.status_code == 200, f"Auth URL endpoint failed with status {response.status_code}"
        
        data = response.json()
        assert 'url' in data, "Response missing url field"
        assert 'instructions' in data, "Response missing instructions field"
        
        url = data['url']
        # Verify URL structure
        assert 'https://www.strava.com/oauth/authorize' in url, "URL should be Strava OAuth authorize endpoint"
        assert 'client_id=' in url, "URL missing client_id parameter"
        assert 'response_type=code' in url, "URL missing response_type=code"
        assert 'redirect_uri=' in url, "URL missing redirect_uri"
        assert 'approval_prompt=force' in url, "URL should force approval prompt"
        
        # CRITICAL: Verify scope includes activity:read_all
        assert 'scope=read,activity:read_all' in url or 'scope=activity:read_all' in url, \
            f"URL missing activity:read_all scope. Got: {url}"
        
        print(f"✓ Auth URL endpoint returns valid OAuth URL with activity:read_all scope")
        print(f"  URL: {url[:100]}...")
        
    def test_strava_exchange_code_endpoint_exists(self):
        """Test POST /api/strava/exchange-code endpoint exists and validates code"""
        # Test with empty code - should fail validation
        response = requests.post(
            f"{BASE_URL}/api/strava/exchange-code",
            json={"code": ""}
        )
        # Should fail - empty code is invalid
        assert response.status_code in [400, 401], \
            f"Exchange with empty code should fail, got {response.status_code}"
        
        print(f"✓ Exchange code endpoint exists and validates input")
        
        # Test with invalid code - should fail at Strava
        response2 = requests.post(
            f"{BASE_URL}/api/strava/exchange-code",
            json={"code": "invalid_test_code_12345"}
        )
        # Should fail at Strava API level
        assert response2.status_code in [400, 401], \
            f"Exchange with invalid code should fail, got {response2.status_code}"
        
        print(f"✓ Exchange code endpoint validates and rejects invalid codes")

    def test_strava_profile_after_token(self):
        """Test GET /api/strava/profile returns Daniele Pascolini if token is valid"""
        response = requests.get(f"{BASE_URL}/api/strava/profile")
        
        if response.status_code == 200:
            data = response.json()
            assert 'name' in data, "Profile missing name field"
            assert 'connected' in data, "Profile missing connected field"
            
            # Verify it's Daniele Pascolini
            name = data['name']
            assert 'Daniele' in name, f"Expected Daniele Pascolini, got {name}"
            assert 'Pascolini' in name, f"Expected Daniele Pascolini, got {name}"
            assert data['connected'] == True, "Connected should be True"
            
            print(f"✓ Strava profile returns: {name} (connected={data['connected']})")
        elif response.status_code == 401:
            # Token might be expired or invalid - this is expected
            print(f"⚠ Strava profile returns 401 - token needs refresh (expected behavior)")
        else:
            raise AssertionError(f"Unexpected status {response.status_code}: {response.text}")

    def test_strava_activities_needs_reauth(self):
        """Test GET /api/strava/activities handles 401 gracefully with needs_reauth"""
        response = requests.get(f"{BASE_URL}/api/strava/activities")
        
        assert response.status_code == 200, f"Activities endpoint should return 200, got {response.status_code}"
        
        data = response.json()
        assert 'needs_reauth' in data, "Response missing needs_reauth field"
        assert 'activities' in data, "Response missing activities field"
        
        # Should be true due to scope limitation (current token only has 'read', not 'activity:read_all')
        assert data['needs_reauth'] == True, \
            f"Expected needs_reauth=true (scope limitation), got {data['needs_reauth']}"
        
        # Should have error message
        if 'error' in data:
            error_msg = data['error']
            print(f"✓ Activities returns needs_reauth=true with error: {error_msg[:80]}")
        else:
            print(f"✓ Activities returns needs_reauth=true")

    def test_strava_sync_scope_limitation(self):
        """Test POST /api/strava/sync handles scope limitation and returns helpful message"""
        response = requests.post(f"{BASE_URL}/api/strava/sync")
        
        assert response.status_code == 200, f"Sync endpoint should return 200, got {response.status_code}"
        
        data = response.json()
        assert 'synced' in data or 'needs_reauth' in data, \
            "Response should have synced count or needs_reauth flag"
        
        # If needs_reauth is true, should have helpful message
        if data.get('needs_reauth') == True:
            message = data.get('message') or data.get('error', '')
            assert len(message) > 0, "Should have message explaining scope limitation"
            print(f"✓ Sync returns needs_reauth with message: {message[:100]}")
        else:
            # Sync worked - that's also good
            print(f"✓ Sync successful: {data.get('synced', 0)} activities synced")


class TestStravaOAuthURLDetails:
    """Detailed tests for OAuth URL parameters"""
    
    def test_oauth_url_has_all_required_params(self):
        """Verify OAuth URL contains all required Strava parameters"""
        response = requests.get(f"{BASE_URL}/api/strava/auth-url")
        data = response.json()
        url = data['url']
        
        required_params = [
            ('client_id=', 'Client ID'),
            ('response_type=code', 'Response type'),
            ('redirect_uri=', 'Redirect URI'),
            ('approval_prompt=force', 'Force approval'),
            ('scope=', 'Scope parameter'),
        ]
        
        for param, name in required_params:
            assert param in url, f"OAuth URL missing {name}: {param}"
        
        print(f"✓ OAuth URL has all required parameters")
    
    def test_oauth_url_scope_includes_activity_read_all(self):
        """Verify scope specifically includes activity:read_all (not just read)"""
        response = requests.get(f"{BASE_URL}/api/strava/auth-url")
        data = response.json()
        url = data['url']
        
        # Extract scope parameter
        if 'scope=' in url:
            scope_part = url.split('scope=')[1].split('&')[0]
            scopes = scope_part.split(',')
            
            assert 'activity:read_all' in scopes or 'activity%3Aread_all' in scope_part, \
                f"Scope should include activity:read_all. Got: {scope_part}"
            
            print(f"✓ Scope includes activity:read_all: {scope_part}")
        else:
            raise AssertionError("URL doesn't contain scope parameter")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
