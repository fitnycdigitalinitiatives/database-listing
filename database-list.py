#!/usr/bin/env python

import os
import json
import requests

endpoint = 'https://lgapi-us.libapps.com/1.1/assets'
params = {
    'site_id': '942',
    'key': os.environ["API_KEY"],
    'asset_types': '10',
    'expand': 'permitted_uses,az_types,az_props,subjects',
}

proxy = 'https://libproxy.fitsuny.edu/login?url='

databases = requests.get(endpoint, params=params).json()

#add proxy here so that if it ever changes can be updated here rather than in javascript
for index, database in enumerate(databases):
    if database['meta']['enable_proxy']:
        databases[index]['url'] = proxy + databases[index]['url']

filename = "gh-pages/databases.json"
with open(filename, "w") as outfile:
    json.dump(databases, outfile, indent=4)
