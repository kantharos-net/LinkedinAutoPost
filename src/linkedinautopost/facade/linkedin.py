import json
import webbrowser
from urllib.parse import parse_qs, urlparse, urlencode

import requests

from linkedinautopost.constants.constants import (LINKEDIN_API_URL,
                                                  LINKEDIN_POST_URL)
from linkedinautopost.utils.config import config


class LinkedIn:
    __auth_code = ""
    __access_token = ""
    __headers = ""
    __user_info = ""

    def get_auth_code(self):
        # Make a HTTP request to the server
        # Once authorized, will redirect to redirect_uri

        params = {
            "response_type": "code",
            "client_id": config.credentials.get("client_id"),
            "redirect_uri": config.credentials.get("redirect_uri"),
            "scope": "w_member_social openid email profile",
        }

        response = requests.get(f"{LINKEDIN_API_URL}/authorization", params=params)

        webbrowser.open(response.url)

    def get_access_token(self, auth_code):
        params = {
            "grant_type": "authorization_code",
            "code": f"{auth_code}",
            "client_id": config.credentials["client_id"],
            "client_secret": config.credentials["client_secret"],
            "redirect_uri": config.credentials["redirect_uri"],
        }

        response = requests.post(
            f"{LINKEDIN_API_URL}/accessToken",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            params=params,
        )
        token = response.json()
        self.__access_token = token["access_token"]
        self.get_headers()
        self.get_user_info()

    def get_headers(self):
        self.__headers = {
            "Authorization": f"Bearer {self.__access_token}",
            "cache-control": "no-cache",
            "X-Restli-Protocol-Version": "2.0.0",
        }

    def get_user_info(self):
        response = requests.get(f"{LINKEDIN_POST_URL}/userinfo", headers=self.__headers)
        user_info = response.json()
        self.__user_info = user_info

    def get_auth_url(self) -> str:
        """Return the LinkedIn OAuth authorization URL without making a network call."""
        params = {
            "response_type": "code",
            "client_id": config.credentials.get("client_id"),
            "redirect_uri": config.credentials.get("redirect_uri"),
            "scope": "w_member_social openid email profile",
        }
        return f"{LINKEDIN_API_URL}/authorization?{urlencode(params)}"

    def set_token(self, token: str) -> None:
        """Accept an existing access token, rebuild headers, and fetch user info if not cached."""
        self.__access_token = token
        self.get_headers()
        if not self.__user_info:
            self.get_user_info()

    def is_authenticated(self) -> bool:
        """Return True if an access token is present."""
        return bool(self.__access_token)

    def get_user_name(self) -> str:
        """Return the authenticated user's display name, or empty string if not set."""
        return self.__user_info.get("name", "") if self.__user_info else ""

    def post(self, message):
        post_data = {
            "author": f"urn:li:person:{self.__user_info['sub']}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": message},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "CONNECTIONS"},
        }

        response = requests.post(
            f"{LINKEDIN_POST_URL}/ugcPosts", headers=self.__headers, json=post_data
        )
        
        return response.json()
