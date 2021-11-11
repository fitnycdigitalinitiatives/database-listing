#!/usr/bin/env python

import os
import json
import requests

api_key = os.environ["API_KEY"]
endpoint = 'https://lgapi-us.libapps.com/1.1/assets'
params = {
    'site_id': '942',
    'key': api_key,
    'asset_types': '10',
    'expand': 'permitted_uses,az_types,az_props,subjects',
}

databases = requests.get(endpoint, params=params).json()

filename = "gh-pages/databases.json"
with open(filename, "w") as outfile:
    json.dump(databases, outfile, indent=4)
