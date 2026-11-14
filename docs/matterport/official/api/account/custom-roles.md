<!-- source: https://developers.matterport.com/api/account/custom-roles/ -->

On this page

note

Custom Roles API is only available for Enterprise-level Matterport Subscriptions

## Introduction​

**Custom Roles** allow an account to create and assign custom user roles beyond the default stock roles of collaborators, administrators, billing contact, and account owner. Custom roles can be configured to allow and deny specific permissions to better control access and features for members of the account.

Detailed documentation regarding custom roles can be found at the following links in our support portal.

[Configure Custom User Roles](https://support.matterport.com/s/article/Configure-Custom-User-Roles)  
[Configure User Groups](https://support.matterport.com/s/article/Configure-User-Groups)  
[Examples of Custom Roles](https://support.matterport.com/s/article/Examples-of-Custom-Roles)  
[Review Roles and Permissions](https://support.matterport.com/s/article/Review-Roles-and-Permissions)

## Overview​

This document will detail the features of **Custom Roles** availble through the Matterport Account API.

Please review the [Matterport APIs Overview](/api/) documentation to understand the Matterport Model API and Account API.

While creating and setting permissions for custom roles and user groups is best done through the [users setting page](https://my.matterport.com/users), the following API queries and mutations can be used to automate user management.

## What are use-cases for Custom Roles with the API?​

  * Retrieve custom role IDs
  * Retrieve user group IDs
  * Retrieve list of permissions sets for custom roles
  * Invite users with an existing custom role
  * Assign users and groups to custom roles
  * Assign users to user group



## Sample Queries (Account API)​

Query All Custom Role IDs and Names
    
    
    query getAllRoleIds{  
    
    
      roles(query: {include: CUSTOM, offset: null}){  
    
    
        nextOffset  
    
    
        totalResults  
    
    
        results{  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "roles": {  
    
    
          "nextOffset": null,  
    
    
          "totalResults": 7,  
    
    
          "results": [  
    
    
            {  
    
    
              "id": "99a5c0m5qakpn16yhe9wbz25c",  
    
    
              "name": "Custom Role 1"  
    
    
            },  
    
    
            {  
    
    
              "id": "cdwxak49ihd8qbf1rku45z16d",  
    
    
              "name": "Custom Role 2"  
    
    
            },  
    
    
            {  
    
    
              "id": "09ucf41tzhm5tysk5issbu46a",  
    
    
              "name": "Site 1 Viewer"  
    
    
            },  
    
    
            {  
    
    
              "id": "dys7trhyn5t8rdu8ntzbap0bb",  
    
    
              "name": "Test Role 1"  
    
    
            },  
    
    
            {  
    
    
              "id": "zrc4c7hdk9xceptw86007e6zb",  
    
    
              "name": "Test Role 2"  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this in our interactive console](https://api.matterport.com/api/accounts/graphiql/?query=query%20getAllRoleIds%7B%0A%20%20roles\(query%3A%20%7Binclude%3A%20CUSTOM%2C%20offset%3A%20null%7D\)%7B%0A%20%20%20%20nextOffset%0A%20%20%20%20totalResults%0A%20%20%20%20results%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&operationName=getAllRoleIds)

Query Role ID From Name
    
    
    query getRoleIdFromName($roleName: String!){  
    
    
      roles(query: {include: CUSTOM, searchText: $roleName}){  
    
    
        results{  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # Variables  
    
    
    {  
    
    
      "roleName": "Custom Role 1"  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "roles": {  
    
    
          "results": [  
    
    
            {  
    
    
              "id": "99a5c0m5qakpn16yhe9wbz25c",  
    
    
              "name": "Custom Role 1"  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this in our interactive console](https://api.matterport.com/api/accounts/graphiql/?query=query%20getRoleIdFromName\(%24roleName%3A%20String!\)%7B%0A%20%20roles\(query%3A%20%7Binclude%3A%20CUSTOM%2C%20searchText%3A%20%24roleName%7D\)%7B%0A%20%20%20%20results%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&operationName=getRoleIdFromName&variables=%7B%0A%20%20%22roleName%22%3A%20%22Custom%20Role%201%22%0A%7D)

Query All User Group Details
    
    
    query getAllUserGroups {  
    
    
      userGroups(offset: null) {  
    
    
        nextOffset  
    
    
        totalResults  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
          roles {  
    
    
            id  
    
    
            name  
    
    
          }  
    
    
          members {  
    
    
            results {  
    
    
              user {  
    
    
                email  
    
    
                id  
    
    
              }  
    
    
            }  
    
    
          }  
    
    
          modelShares {  
    
    
            results {  
    
    
              sharedObject {  
    
    
                id  
    
    
                name  
    
    
              }  
    
    
              roles{  
    
    
                id  
    
    
                name  
    
    
              }  
    
    
            }  
    
    
          }  
    
    
          folderShares {  
    
    
            results {  
    
    
              sharedObject {  
    
    
                id  
    
    
                name  
    
    
              }  
    
    
              roles {  
    
    
                id  
    
    
                name  
    
    
              }  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "userGroups": {  
    
    
          "nextOffset": null,  
    
    
          "totalResults": 1,  
    
    
          "results": [  
    
    
            {  
    
    
              "id": "i0aiuf25nrgdfh4yz7df5s3kc",  
    
    
              "name": "User Group 1",  
    
    
              "roles": [  
    
    
                {  
    
    
                  "id": "99a5c0m5qakpn16yhe9wbz25c",  
    
    
                  "name": "Custom Role 1"  
    
    
                }  
    
    
              ],  
    
    
              "members": {  
    
    
                "results": [  
    
    
                  {  
    
    
                    "user": {  
    
    
                      "email": "user@example.com",  
    
    
                      "id": "tbenTcYfzTj"  
    
    
                    }  
    
    
                  },  
    
    
                ]  
    
    
              },  
    
    
              "modelShares": {  
    
    
                "results": []  
    
    
              },  
    
    
              "folderShares": {  
    
    
                "results": [  
    
    
                  {  
    
    
                    "sharedObject": {  
    
    
                      "id": "7ZQHTdNQziL",  
    
    
                      "name": "My Spaces"  
    
    
                    },  
    
    
                    "roles": [  
    
    
                      {  
    
    
                        "id": "00000001001",  
    
    
                        "name": "viewer"  
    
    
                      }  
    
    
                    ]  
    
    
                  },  
    
    
                  {  
    
    
                    "sharedObject": {  
    
    
                      "id": "AAd2PmNoFQT",  
    
    
                      "name": "top level folder 1"  
    
    
                    },  
    
    
                    "roles": [  
    
    
                      {  
    
    
                        "id": "00000001002",  
    
    
                        "name": "full"  
    
    
                      }  
    
    
                    ]  
    
    
                  }  
    
    
                ]  
    
    
              }  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this in our interactive console](https://api.matterport.com/api/accounts/graphiql/?query=query%20getAllUserGroups%20%7B%0A%20%20userGroups\(offset%3A%20null\)%20%7B%0A%20%20%20%20nextOffset%0A%20%20%20%20totalResults%0A%20%20%20%20results%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20roles%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20members%20%7B%0A%20%20%20%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20%20%20%20user%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20email%0A%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20modelShares%20%7B%0A%20%20%20%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20%20%20%20sharedObject%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20roles%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20folderShares%20%7B%0A%20%20%20%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20%20%20%20sharedObject%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20roles%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&operationName=getAllUserGroups)

Query User Group ID From Name
    
    
    query getUserGroupIdFromName($userGroupName: String!){  
    
    
      userGroups(query:$userGroupName){  
    
    
        results{  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # Variables  
    
    
    {  
    
    
      "userGroupName": "User Group 1"  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "userGroups": {  
    
    
          "results": [  
    
    
            {  
    
    
              "id": "i0aiuf25nrgdfh4yz7df5s3kc",  
    
    
              "name": "User Group 1"  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this in our interactive console](https://api.matterport.com/api/accounts/graphiql/?query=query%20getUserGroupIdFromName\(%24userGroupName%3A%20String!\)%7B%0A%20%20userGroups\(query%3A%24userGroupName\)%7B%0A%20%20%20%20results%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&operationName=getUserGroupIdFromName&variables=%7B%0A%20%20%22userGroupName%22%3A%20%22User%20Group%201%22%0A%7D)

Query User Membership Details with User Group And Custom Roles Access
    
    
    query getMemberDetails($email: String!){  
    
    
      organization{  
    
    
        membershipByEmail(email:$email){  
    
    
          user{  
    
    
            id  
    
    
            email  
    
    
            objectAccess{  
    
    
              results{  
    
    
                sharedObject{  
    
    
                  __typename  
    
    
                  id  
    
    
                  name  
    
    
                }  
    
    
                isInherited  
    
    
                roles{  
    
    
                  id  
    
    
                  name  
    
    
                }  
    
    
                sharedWith{  
    
    
                  id  
    
    
                  name  
    
    
                  source  
    
    
                }  
    
    
              }  
    
    
            }  
    
    
          }  
    
    
          roles{  
    
    
            id  
    
    
            name  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
      
    
    
    # Variables  
    
    
    {  
    
    
      "email": "user@example.com"  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "organization": {  
    
    
          "membershipByEmail": {  
    
    
            "user": {  
    
    
              "id": "gTMHAe2hwFm",  
    
    
              "email": "user@example.com",  
    
    
              "objectAccess": {  
    
    
                "results": [  
    
    
                  {  
    
    
                    "sharedObject": {  
    
    
                      "__typename": "ShareableFolderSummary",  
    
    
                      "id": "7GxUGVPejAa",  
    
    
                      "name": "Folder A"  
    
    
                    },  
    
    
                    "isInherited": true,  
    
    
                    "roles": [  
    
    
                      {  
    
    
                        "id": "00000001002",  
    
    
                        "name": "full"  
    
    
                      }  
    
    
                    ],  
    
    
                    "sharedWith": {  
    
    
                      "id": "i0aiuf25nrgdfh4yz7df5s3kc",  
    
    
                      "name": "User Group 1",  
    
    
                      "source": "USER_GROUP"  
    
    
                    }  
    
    
                  },  
    
    
                  {  
    
    
                    "sharedObject": {  
    
    
                      "__typename": "ShareableFolderSummary",  
    
    
                      "id": "AAd2PmNoFQT",  
    
    
                      "name": "top level folder 1"  
    
    
                    },  
    
    
                    "isInherited": false,  
    
    
                    "roles": [  
    
    
                      {  
    
    
                        "id": "00000001002",  
    
    
                        "name": "full"  
    
    
                      }  
    
    
                    ],  
    
    
                    "sharedWith": {  
    
    
                      "id": "i0aiuf25nrgdfh4yz7df5s3kc",  
    
    
                      "name": "User Group 1",  
    
    
                      "source": "USER_GROUP"  
    
    
                    }  
    
    
                  },  
    
    
                  {  
    
    
                    "sharedObject": {  
    
    
                      "__typename": "ShareableModelSummary",  
    
    
                      "id": "NuDAWJ1C4RQ",  
    
    
                      "name": "Demo Model 2"  
    
    
                    },  
    
    
                    "isInherited": true,  
    
    
                    "roles": [  
    
    
                      {  
    
    
                        "id": "00000001002",  
    
    
                        "name": "full"  
    
    
                      }  
    
    
                    ],  
    
    
                    "sharedWith": {  
    
    
                      "id": "i0aiuf25nrgdfh4yz7df5s3kc",  
    
    
                      "name": "User Group 1",  
    
    
                      "source": "USER_GROUP"  
    
    
                    }  
    
    
                  },  
    
    
                  {  
    
    
                    "sharedObject": {  
    
    
                      "__typename": "ShareableFolderSummary",  
    
    
                      "id": "7ZQHTdNQziL",  
    
    
                      "name": "My Spaces"  
    
    
                    },  
    
    
                    "isInherited": false,  
    
    
                    "roles": [  
    
    
                      {  
    
    
                        "id": "00000001001",  
    
    
                        "name": "viewer"  
    
    
                      }  
    
    
                    ],  
    
    
                    "sharedWith": {  
    
    
                      "id": "i0aiuf25nrgdfh4yz7df5s3kc",  
    
    
                      "name": "User Group 1",  
    
    
                      "source": "USER_GROUP"  
    
    
                    }  
    
    
                  }  
    
    
                ]  
    
    
              }  
    
    
            },  
    
    
            "roles": [  
    
    
              {  
    
    
                "id": "99a5c0m5qakpn16yhe9wbz25c",  
    
    
                "name": "Custom Role 1"  
    
    
              }  
    
    
            ]  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this in our interactive console](https://api.matterport.com/api/accounts/graphiql/?query=query%20getMemberDetails\(%24email%3A%20String!\)%7B%0A%20%20organization%7B%0A%20%20%20%20membershipByEmail\(email%3A%24email\)%7B%0A%20%20%20%20%20%20user%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20email%0A%20%20%20%20%20%20%20%20objectAccess%7B%0A%20%20%20%20%20%20%20%20%20%20results%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20sharedObject%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20__typename%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20isInherited%0A%20%20%20%20%20%20%20%20%20%20%20%20roles%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20sharedWith%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20source%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20roles%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&operationName=getMemberDetails&variables=%7B%0A%20%20%22email%22%3A%20%22user%40example.com%22%0A%7D)

## Sample Mutations (Account API)​

Invite New User With Specific Custom Role
    
    
    mutation inviteMemberWithRole($email: String!, $roleId: ID!) {  
    
    
      inviteMember(email: $email, roleId: $roleId) {  
    
    
        user {  
    
    
          id  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # Variables  
    
    
    {  
    
    
      "email": "user@example.com",  
    
    
      "roleId": "99a5c0m5qakpn16yhe9wbz25c"  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "inviteMember": {  
    
    
          "user": {  
    
    
            "id": "biLeTE8uWPG"  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this in our interactive console](https://api.matterport.com/api/accounts/graphiql/?query=mutation%20inviteMemberWithRole\(%24email%3A%20String!%2C%20%24roleId%3A%20ID!\)%20%7B%0A%20%20inviteMember\(email%3A%20%24email%2C%20roleId%3A%20%24roleId\)%20%7B%0A%20%20%20%20user%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&operationName=inviteMemberWithRole&variables=%7B%0A%20%20%22email%22%3A%20%22adoss%2Broleinvitetest%40matterport.com%22%2C%0A%20%20%22roleId%22%3A%20%2299a5c0m5qakpn16yhe9wbz25c%22%0A%7D)

Change An Existing Users Role
    
    
    mutation patchUserMembership($email:String!, $roleId: ID!){  
    
    
      patchMembership(email: $email, roleId: $roleId){  
    
    
        user{  
    
    
          email  
    
    
          id  
    
    
        }  
    
    
        status  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # Variables  
    
    
    {  
    
    
      "email": "user@example.com",  
    
    
      "roleId": "99a5c0m5qakpn16yhe9wbz25c"  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "patchMembership": {  
    
    
          "user": {  
    
    
            "email": "user@example.com",  
    
    
            "id": "biLeTE8uWPG"  
    
    
          },  
    
    
          "status": "active"  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this in our interactive console](https://api.matterport.com/api/accounts/graphiql/?query=mutation%20patchUserMembership\(%24email%3AString!%2C%20%24roleId%3A%20ID!\)%7B%0A%20%20patchMembership\(email%3A%20%24email%2C%20roleId%3A%20%24roleId\)%7B%0A%20%20%20%20user%7B%0A%20%20%20%20%20%20email%0A%20%20%20%20%20%20id%0A%20%20%20%20%7D%0A%20%20%20%20status%0A%20%20%7D%0A%7D&operationName=patchUserMembership&variables=%7B%0A%20%20%22email%22%3A%20%22user%40example.com%22%2C%0A%20%20%22roleId%22%3A%20%2299a5c0m5qakpn16yhe9wbz25c%22%0A%7D)

  * Introduction
  * Overview
  * What are use-cases for Custom Roles with the API?
  * Sample Queries (Account API)
  * Sample Mutations (Account API)


