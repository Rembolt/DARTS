<!-- source: https://developers.matterport.com/api/property-intelligence/ -->

On this page

note

Property Intelligence Data in Model API is only available for Enterprise-level Matterport Subscriptions

## Introduction​

**Matterport Property Intelligence** (PI) has a robust API integration that allows developers to integrate detailed dimensional information from their models into their platforms.

Developers can access room names, wall measurements and detailed dimensional data that can be used to recreate the room boundaries and overall layout provided by Property Insights within their own applications.

Model owners are provided with a rich editing tool that will allow them to optionally refine the detected rooms, their boundaries, and their names (labels). The resulting visual changes are also reflected in the data that is provided via our **Model API**.

## Overview​

The following overview describes pertinent use-cases for Matterport Property Intelligence data and how to access that data from our Model API.

New objects in Model API containing data from Property insights can be located within the **dimensionalEstimates** , **floors** , and **rooms** objects.

Detailed definitions for these objects can be found within our [Model API Reference](https://api.matterport.com/model/docs/reference).

## What are use-cases for Property Intelligence data?​

  * Retrieving accurate square foot measurements for a model for billing
  * Retrieving dimensions for floors and rooms for a property listing
  * Retrieving the detected names for rooms
  * Retrieving vector data to redraw a floorplan



## GraphQL Endpoint​

Property Intelligence data is accessed through the Model API endpoint:
    
    
    https://api.matterport.com/api/models/graph  
    

You can also explore the schema interactively in the [Model API GraphiQL console](https://api.matterport.com/model/graphiql).

  * Introduction
  * Overview
  * What are use-cases for Property Intelligence data?
  * GraphQL Endpoint


