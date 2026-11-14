<!-- source: https://developers.matterport.com/api/import/code-examples/ -->

On this page

This page provides a complete Python example for the Import API workflow, including automatic multipart upload support for large files.

## Complete Workflow (Python)​

This example supports **multipart upload** for large files. The upload is automatically split into parts based on the size constraints returned by the API.

Complete Import Workflow
    
    
    import os  
    
    
    import math  
    
    
    import base64  
    
    
    import requests  
    
    
      
    
    
    # ------------------------------------------------------------  
    
    
    # CONFIGURATION  
    
    
    # ------------------------------------------------------------  
    
    
      
    
    
    # Replace these with your ID and secret.  
    
    
    # You can find this in Settings -> Developer Tools -> API Token Management.  
    
    
    TOKEN_ID = ""  
    
    
    TOKEN_SECRET = ""  
    
    
      
    
    
    # Replace this with your org ID.  
    
    
    # You can find it in the settings as "Account ID".  
    
    
    ORG_ID = ""  
    
    
      
    
    
    # Replace this with the path to your E57 file locally.  
    
    
    FILE_PATH = ""  
    
    
      
    
    
    # ------------------------------------------------------------  
    
    
    # END OF CONFIGURATION - DO NOT EDIT BELOW THIS LINE  
    
    
    # ------------------------------------------------------------  
    
    
      
    
    
    ENDPOINT = "https://api.matterport.com/api/import/graph"  
    
    
    MAX_PART_SIZE = 5 * 1024 * 1024 * 1024  # 5 GB  
    
    
      
    
    
      
    
    
    def get_auth_header(token_id, token_secret):  
    
    
        credentials = f"{token_id}:{token_secret}"  
    
    
        base64_credentials = base64.b64encode(credentials.encode()).decode()  
    
    
        return {"Authorization": f"Basic {base64_credentials}"}  
    
    
      
    
    
      
    
    
    def run_query(query, variables=None):  
    
    
        headers = get_auth_header(TOKEN_ID, TOKEN_SECRET)  
    
    
        headers["Content-Type"] = "application/json"  
    
    
        payload = {"query": query, "variables": variables or {}}  
    
    
        response = requests.post(ENDPOINT, headers=headers, json=payload)  
    
    
      
    
    
        if response.status_code != 200:  
    
    
            raise Exception(f"Request failed: {response.status_code} - {response.text}")  
    
    
      
    
    
        result = response.json()  
    
    
      
    
    
        if "errors" in result:  
    
    
            raise Exception(f"GraphQL error: {result['errors']}")  
    
    
      
    
    
        return result["data"]  
    
    
      
    
    
      
    
    
    ADD_IMPORT_SESSION = """  
    
    
    mutation AddImportSession($organizationId: ID, $processType: ProcessType!, $name: String) {  
    
    
      addImportSession(organizationId: $organizationId, processType: $processType, name: $name) {  
    
    
        id  
    
    
      }  
    
    
    }  
    
    
    """  
    
    
      
    
    
    ADD_E57_OBJECT = """  
    
    
    mutation AddE57Object($importSessionId: ID!, $e57: E57ObjectInput!) {  
    
    
      addE57Object(importSessionId: $importSessionId, e57: $e57) {  
    
    
        id  
    
    
        clientId  
    
    
        files {  
    
    
          id  
    
    
          name  
    
    
          clientId  
    
    
          size  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
    """  
    
    
      
    
    
    BEGIN_UPLOAD = """  
    
    
    mutation beginUpload($importSessionId: ID!, $importFileId: ID!) {  
    
    
      beginUpload(importSessionId: $importSessionId, importFileId: $importFileId) {  
    
    
        id  
    
    
      }  
    
    
    }  
    
    
    """  
    
    
      
    
    
    REQUEST_PART_UPLOAD = """  
    
    
    mutation requestPartUpload($importSessionId: ID!, $importFileId: ID!, $part: Int!, $size: Long!) {  
    
    
      requestPartUpload(importSessionId: $importSessionId, importFileId: $importFileId, part: $part, size: $size) {  
    
    
        url  
    
    
        minSize  
    
    
        maxSize  
    
    
        headers {  
    
    
          key  
    
    
          value  
    
    
        }  
    
    
        method  
    
    
        completed  
    
    
      }  
    
    
    }  
    
    
    """  
    
    
      
    
    
    COMPLETE_UPLOAD = """  
    
    
    mutation completeUpload($importSessionId: ID!, $importFileId: ID!, $completedParts: [CompletedPartInput!]!) {  
    
    
      completeUpload(importSessionId: $importSessionId, importFileId: $importFileId, completedParts: $completedParts) {  
    
    
        id  
    
    
      }  
    
    
    }  
    
    
    """  
    
    
      
    
    
    COMMIT_IMPORT_SESSION = """  
    
    
    mutation commitImportSession($importSessionId: ID!) {  
    
    
      commitImportSession(importSessionId: $importSessionId) {  
    
    
        id  
    
    
      }  
    
    
    }  
    
    
    """  
    
    
      
    
    
      
    
    
    def upload_file(session_id, client_file_id, file_path):  
    
    
        """Upload a file, automatically splitting into multiple parts for large files.  
    
    
      
    
    
        The API returns minSize and maxSize for each part. Every part except  
    
    
        the last must be at least minSize bytes. This function requests part 0  
    
    
        to discover the size constraints, then streams the file in  
    
    
        appropriately sized chunks.  
    
    
        """  
    
    
        file_size = os.path.getsize(file_path)  
    
    
      
    
    
        # Request part 0 to learn the size constraints  
    
    
        res = run_query(  
    
    
            REQUEST_PART_UPLOAD,  
    
    
            {"importSessionId": session_id, "importFileId": client_file_id, "part": 0, "size": file_size},  
    
    
        )  
    
    
        part_info = res["requestPartUpload"]  
    
    
        min_part_size = part_info["minSize"]  
    
    
      
    
    
        # Choose a chunk size (use minSize so each part meets the minimum,  
    
    
        # but never exceed the 5 GB maximum)  
    
    
        chunk_size = min(min_part_size, MAX_PART_SIZE)  
    
    
        total_parts = math.ceil(file_size / chunk_size)  
    
    
        print(f"File size: {file_size} bytes — uploading in {total_parts} part(s) "  
    
    
              f"(chunk size: {chunk_size} bytes)")  
    
    
      
    
    
        completed_parts = []  
    
    
      
    
    
        with open(file_path, "rb") as f:  
    
    
            for part_number in range(total_parts):  
    
    
                part_size = min(chunk_size, file_size - part_number * chunk_size)  
    
    
      
    
    
                # Request a pre-signed URL for this part  
    
    
                res = run_query(  
    
    
                    REQUEST_PART_UPLOAD,  
    
    
                    {  
    
    
                        "importSessionId": session_id,  
    
    
                        "importFileId": client_file_id,  
    
    
                        "part": part_number,  
    
    
                        "size": part_size,  
    
    
                    },  
    
    
                )  
    
    
                part_info = res["requestPartUpload"]  
    
    
      
    
    
                chunk = f.read(chunk_size)  
    
    
      
    
    
                print(f"  Uploading part {part_number + 1}/{total_parts} "  
    
    
                      f"({len(chunk)} bytes)...")  
    
    
      
    
    
                s3_resp = requests.request(  
    
    
                    part_info["method"],  
    
    
                    part_info["url"],  
    
    
                    data=chunk,  
    
    
                    headers={"Content-Type": "application/octet-stream"},  
    
    
                )  
    
    
      
    
    
                if s3_resp.status_code != 200:  
    
    
                    raise Exception(  
    
    
                        f"Upload failed for part {part_number}: "  
    
    
                        f"{s3_resp.status_code} {s3_resp.text}"  
    
    
                    )  
    
    
      
    
    
                etag = s3_resp.headers.get("ETag").replace('"', "")  
    
    
                completed_parts.append(  
    
    
                    {"body": "", "headers": [{"key": "ETag", "value": etag}]}  
    
    
                )  
    
    
      
    
    
        return completed_parts  
    
    
      
    
    
      
    
    
    def main():  
    
    
        if not os.path.exists(FILE_PATH):  
    
    
            print(f"Error: no file found at {FILE_PATH}")  
    
    
            return  
    
    
      
    
    
        file_name = os.path.basename(FILE_PATH)  
    
    
        file_size = os.path.getsize(FILE_PATH)  
    
    
        client_file_id = "e57-file"  
    
    
      
    
    
        print(f"Starting upload for {file_name} ({file_size} bytes)...\n")  
    
    
      
    
    
        print("Step 1: Creating import session")  
    
    
        res_step1 = run_query(  
    
    
            ADD_IMPORT_SESSION,  
    
    
            {  
    
    
                "organizationId": ORG_ID,  
    
    
                "processType": "E57",  
    
    
                "name": f"Python import: {file_name}",  
    
    
            },  
    
    
        )  
    
    
        session_id = res_step1["addImportSession"]["id"]  
    
    
        print(f"Session ID is {session_id}\n")  
    
    
      
    
    
        print("Step 2: Adding E57 object to session")  
    
    
        run_query(  
    
    
            ADD_E57_OBJECT,  
    
    
            {  
    
    
                "importSessionId": session_id,  
    
    
                "e57": {  
    
    
                    "id": "e57-obj",  
    
    
                    "file": {  
    
    
                        "clientId": client_file_id,  
    
    
                        "name": file_name,  
    
    
                        "type": "application/octet-stream",  
    
    
                        "size": file_size,  
    
    
                    },  
    
    
                },  
    
    
            },  
    
    
        )  
    
    
        print("E57 object added\n")  
    
    
      
    
    
        print("Step 3: Beginning upload")  
    
    
        run_query(  
    
    
            BEGIN_UPLOAD,  
    
    
            {"importSessionId": session_id, "importFileId": client_file_id},  
    
    
        )  
    
    
        print("Upload sequence started\n")  
    
    
      
    
    
        print("Steps 4-5: Uploading file (multipart if large)")  
    
    
        completed_parts = upload_file(session_id, client_file_id, FILE_PATH)  
    
    
        print(f"Upload complete. {len(completed_parts)} part(s) uploaded.\n")  
    
    
      
    
    
        print("Step 6: Completing upload registration")  
    
    
        run_query(  
    
    
            COMPLETE_UPLOAD,  
    
    
            {  
    
    
                "importSessionId": session_id,  
    
    
                "importFileId": client_file_id,  
    
    
                "completedParts": completed_parts,  
    
    
            },  
    
    
        )  
    
    
        print("Upload registered successfully\n")  
    
    
      
    
    
        print("Step 7: Committing import session")  
    
    
        run_query(COMMIT_IMPORT_SESSION, {"importSessionId": session_id})  
    
    
        print("Import session committed\n")  
    
    
        print("------------------------------------------------------------------------")  
    
    
        print("Success, please check Matterport cloud once the model is ready!\n")  
    
    
        print("------------------------------------------------------------------------")  
    
    
      
    
    
      
    
    
    if __name__ == "__main__":  
    
    
        try:  
    
    
            main()  
    
    
        except Exception as e:  
    
    
            print("ERROR: " + str(e))  
    

## Running the Script​

  1. **Install Python 3.7+** if you don't already have it:
         
         python3 --version  
         

  2. **Install the`requests` library:**
         
         pip3 install requests  
         

  3. **Save the script** above to a file, e.g. `import_e57.py`.

  4. **Fill in the configuration** at the top of the script:
         
         TOKEN_ID = "your-token-id"  
         
         
         TOKEN_SECRET = "your-token-secret"  
         
         
         ORG_ID = "your-org-id"  
         
         
         FILE_PATH = "./my-scan.e57"  
         

  5. **Run the script:**
         
         python3 import_e57.py  
         

Expected output:
         
         Starting upload for my-scan.e57 (524288000 bytes)...  
         
         
           
         
         
         Step 1: Creating import session  
         
         
         Session ID is abc123  
         
         
           
         
         
         Step 2: Adding E57 object to session  
         
         
         E57 object added  
         
         
           
         
         
         Step 3: Beginning upload  
         
         
         Upload sequence started  
         
         
           
         
         
         Steps 4-5: Uploading file (multipart if large)  
         
         
         File size: 524288000 bytes — uploading in 5 part(s) (chunk size: 104857600 bytes)  
         
         
           Uploading part 1/5 (104857600 bytes)...  
         
         
           Uploading part 2/5 (104857600 bytes)...  
         
         
           Uploading part 3/5 (104857600 bytes)...  
         
         
           Uploading part 4/5 (104857600 bytes)...  
         
         
           Uploading part 5/5 (104857600 bytes)...  
         
         
         Upload complete. 5 part(s) uploaded.  
         
         
           
         
         
         Step 6: Completing upload registration  
         
         
         Upload registered successfully  
         
         
           
         
         
         Step 7: Committing import session  
         
         
         Import session committed  
         
         
           
         
         
         ------------------------------------------------------------------------  
         
         
         Success, please check Matterport cloud once the model is ready!  
         
         
           
         
         
         ------------------------------------------------------------------------  
         




Refer to the [Import API Guide](/api/import/guide/) for detailed step-by-step instructions.

  * Complete Workflow (Python)
  * Running the Script


