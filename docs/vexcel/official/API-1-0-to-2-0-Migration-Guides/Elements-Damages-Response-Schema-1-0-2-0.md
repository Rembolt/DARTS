<!-- source: https://vexcel.atlassian.net/wiki/spaces/APIDOCS/pages/3589275652 -->
# Elements Damages Response Schema 1.0 → 2.0

| **API 1.0**| **API 2.0**  
---|---|---  
1| [|   
2| | {|   
3| | | post_cat astrophe: {|   
4| | | | structure: [|   
5| | | | | {|   
6| | | | | | "catastrophe_score": 0.0,| "structures.post-catastrophe.catastrophe-score":0.0,  
7| | | | | | "fema_classification": null,| "structures.post-catastrophe.fema-classification":null,  
8| | | | | | "roof_condition": {|   
9| | | | | | | "structural_damage_percent": null,| "structures.post-catastrophe.roof-condition.structural-damage-percent":null,  
10| | | | | | | "missing_material_percent": 0.0,| "structures.post-catastrophe.roof-condition.missing-material-percent":0.0,  
11| | | | | | | "tarp_percent": null,| "structures.post-catastrophe.roof-condition.tarp-percent":null,  
12| | | | | | | "debris_percent": 0.0,| "structures.post-catastrophe.roof-condition.debris-percent":0.0,  
13| | | | | | | "discoloration": {|   
14| | | | | | | | "detected": null,| "structures.post-catastrophe.roof-condition.discoloration.detected":null,  
15| | | | | | | | "percentage": null,| "structures.post-catastrophe.roof-condition.discoloration.percent":null,  
16| | | | | | | | "score": null| "structures.post-catastrophe.roof-condition.discoloration.score":null,  
17| 2.0 only - not present in 1.0| "structures.post-catastrophe.roof-object.solar-panel-damage.detected":null,  
18| 2.0 only - not present in 1.0| "structures.post-catastrophe.roof-object.water-heater-damage.detected":null,  
19| | | | | | | }|   
20| | | | | | },|   
21| | | | | | "source_image_metadata": {|   
22| | | | | | | "camera_technology": null,| "structures.post-catastrophe.source-image-metadata.camera-technology":null,  
23| | | | | | | "gsd": 3.82,| "structures.post-catastrophe.source-image-metadata.gsd":3.82,  
24| | | | | | | "image_id": "2022~us-ca-mill-fire-2022~graydata-383~images~NS_20220907_173944_124_26EAD516BEA02B2_rgb",| "structures.post-catastrophe.source-image-metadata.image-id":"2022~us-ca-mill-fire-2022~graydata-383~images~NS_20220907_173944_124_26EAD516BEA02B2_rgb",  
25| | | | | | | "capture_date": "2022-09-07 00:00:00.0",| "structures.post-catastrophe.source-image-metadata.capture_date":"2022-09-07T00:00:00",  
26| | | | | | | "version": null,| "structures.post-catastrophe.source-image-metadata.version":null,  
27| | | | | | | "layer_name": "graysky",| "structures.post-catastrophe.source-image-metadata.layer-name":"graysky",  
28| | | | | | | "aoi": "us-ca-mill-fire-2022",| "structures.post-catastrophe.metadata.event":"MillFire",  
29| | | | | | | "orientation_source": null,| "structures.post-catastrophe.source-image-metadata.orientation_source":"V",  
30| | | | | | | "child_aoi": null,| "structures.post-catastrophe.metadata.collection":"graydata-383",  
31| | | | | | | "HistoScore": null| "structures.post-catastrophe.metadata.HistoScore":null,  
32| | | | | | },|   
33| | | | | | "primaryStructure": true| "structures.post-catastrophe.primary-structure":true  
34| | | | | }|   
35| | | | ]|   
36| | | },|   
37| | | "pre_catastrophe": {|   
38| | | | "structure": [|   
39| | | | | {|   
40| | | | | | "source_image_metadata": {|   
41| | | | | | | "camera_technology": null,| "structures.pre-catastrophe.metadata.camera-technology":null,  
42| | | | | | | "gsd": 7.56,| "structures.pre-catastrophe.metadata.gsd":7.56,  
43| | | | | | | "image_id": "2019~n41w124-n41w123-n41w122-us-ca-crescentcity-2019~nadir~1234-lvl02-rgbi",| 1.0 Only - not present in 2.0  
44| | | | | | | "capture_date": "2019-06-02 00:00:00.0",| "structures.pre-catastrophe.metadata.capture-date":"2019-06-02T00:00:00",  
45| | | | | | | "version": null,| 1.0 Only - not present in 2.0  
46| | | | | | | "layer_name": "bluesky-high",| "structures.pre-catastrophe.metadata.layer-name":"wide-area",  
47| | | | | | | "aoi": "USUSCON1901",| 1.0 Only - not present in 2.0 - not descriptive  
48| | | | | | | "orientation_source": "NADIR",| 1.0 Only - not present in 2.0  
49| | | | | | | "child_aoi": null,| "structures.pre-catastrophe.metadata.collection":"n41w124-n41w123-n41w122-us-ca-crescentcity-2019",  
50| | | | | | | HistoScore: null| 1.0 Only - not present in 2.0 - not applicable to pre-catastrophe  
51| | | | | | },|   
52| | | | | | "roof_condition_report": {|   
53| | | | | | | "discolorated": {|   
54| | | | | | | | "detected": null,| 1.0 Only - not present in 2.0  
55| | | | | | | | "percentage": null,| 1.0 Only - not present in 2.0  
56| | | | | | | | "score": null| 1.0 Only - not present in 2.0  
57| | | | | | | },|   
58| | | | | | | "Missing Material": null,| 1.0 Only - not present in 2.0  
59| | | | | | | "Tarp": null| 1.0 Only - not present in 2.0  
60| | | | | | },|   
61| | | | | | "roof_condition": {|   
62| | | | | | | "value": 5.0| "structures.pre-catastrophe.roof-characteristics.condition.value":5.0,  
63| | | | | | },|   
64| | | | | | "footPrint": {|   
65| | | | | | | "area": 299.1306967879911,| "structures.pre-catastrophe.footprint.area":299.59905674383634,  
66| | | | | | | "wkt": "POLYGON((-122.38186147291421 41.498960161598134,-122.38186251862433 41.499013811945986,-122.38183396293445 41.49901412652505,-122.38183432918402 41.499032917434725,-122.38185216192417 41.49903272098414,-122.38185392173085 41.49909300961034,-122.38184000491734 41.49909323920939,-122.38184172496935 41.499152137446686,-122.38166103938015 41.49915412778063,-122.38165955241656 41.49907782675201,-122.38169182906063 41.49907747123065,-122.3816903053969 41.49899928885922,-122.38170581330652 41.49899911803908,-122.38170508766578 41.49896188430451,-122.38186147291421 41.498960161598134))"| "structures.pre-catastrophe.footprint.wkt": "POLYGON ((-122.38186147291421 41.498960161598134, -122.38186251862433 41.499013811945986, -122.38183396293445 41.49901412652505, -122.38183432918402 41.499032917434725, -122.38185216192417 41.49903272098414, -122.38185392173085 41.49909300961034, -122.38184000491734 41.49909323920939, -122.38184172496935 41.499152137446686, -122.38166103938015 41.49915412778063, -122.38165955241656 41.49907782675201, -122.38169182906063 41.49907747123065, -122.3816903053969 41.49899928885922, -122.38170581330652 41.49899911803908, -122.38170508766578 41.49896188430451, -122.38186147291421 41.498960161598134))",  
67| | | | | | },|   
68| | | | | | "ground_elevation": {|   
69| | | | | | | "value": 904.6464000000001| "structures.pre-catastrophe.ground-elevation.value":2968.0,  
70| | | | | | },|   
71| | | | | | "primaryStructure": true,| "structures.pre-catastrophe.primary-structure":true,  
72| | | | | | "roof_material": {|   
73| | | | | | | "score": 0.65,| "structures.pre-catastrophe.roof-characteristics.material.score":0.65,  
74| | | | | | | "class": "shingle"| "structures.pre-catastrophe.roof-characteristics.material.class":"shingle",  
75| | | | | | },|   
76| | | | | | "roof_shape": {|   
77| | | | | | | "value": "gable",| "structures.pre-catastrophe.roof-characteristics.shape.value":"gable",  
78| | | | | | | "score": 0.98| "structures.pre-catastrophe.roof-characteristics.shape.score":0.98,  
79| | | | | | },|   
80| | | | | | "roof_solar": {|   
81| | | | | | | "value": "false",| "structures.pre-catastrophe.roof-solar.detected":false,  
82| | | | | | | "score": 0.0| "structures.pre-catastrophe.roof-solar.score":null,  
83| | | | | | },|   
84| | | | | | "tree_cover": {|   
85| | | | | | | "percent": 0.0| 1.0 Only - not present in 2.0  
86| | | | | | },|   
87| | | | | | "roof_top_location": {|   
88| | | | | | | "wkt": "POINT(-122.3817721064149 41.49905519433268)"| "structures.pre-catastrophe.roof-characteristics.centroid": "POINT (-122.3817721064149 41.49905519433268)",  
89| | | | | | },|   
90| | | | | | "defensible_space": {|   
91| | | | | | | "image": {|   
92| | | | | | | | "image_id": null,| 1.0 Only - not present in 2.0 - always null  
93| | | | | | | | "regionContained": false| 1.0 Only - not present in 2.0 - always null  
94| | | | | | | },|   
95| | | | | | | "report": {|   
96| | | | | | | | "DSB5": null,| "structures.pre-catastrophe.defensible-space.zone1-building":null,  
97| | | | | | | | "DSB30": 2.0,| "structures.pre-catastrophe.defensible-space.zone2-building":2.0,  
98| | | | | | | | "DSB100": 3.0,| "structures.pre-catastrophe.defensible-space.zone3-building":3.0,  
99| | | | | | | | "DSB200": null,| "structures.pre-catastrophe.defensible-space.zone4-building":null,  
100| | | | | | | | "DST5": null,| "structures.pre-catastrophe.defensible-space.zone1-tree":null,  
101| | | | | | | | "DST30": 13.0,| "structures.pre-catastrophe.defensible-space.zone2-tree":13.0,  
102| | | | | | | | "DST100": 26.0,| "structures.pre-catastrophe.defensible-space.zone3-tree":26.0,  
103| | | | | | | | "DST200": null| "structures.pre-catastrophe.defensible-space.zone4-tree":null,  
104| | | | | | | },|   
105| | | | | | | "status": "SUCCESS"| 1.0 Only - not present in 2.0 - always SUCCESS  
106| | | | | | }|   
107| | | | | }|   
108| | | | ],|   
109| | | | "property_features": {|   
110| 2.0 Only - not present in 1.0| "structure-count":1,  
111| | | | | "pool": {|   
112| | | | | | "detected": null,| "pre-catastrophe.pool.detected":null,  
113| | | | | | "score": null,| "pre-catastrophe.pool.score":null,  
114| | | | | | "area": null| "pre-catastrophe.pool.total-area":null,  
115| | | | | },|   
116| | | | | "parcel_wkt": "POLYGON((-122.381311197912 41.4992189298324,-122.381315721263 41.4992130721549,-122.381319941184 41.4992071434356,-122.381323883846 41.4992011129744,-122.381327545682 41.4991949852852,-122.381330919547 41.4991887675948,-122.381334005495 41.4991824689073,-122.381336795188 41.4991760973538,-122.381339286258 41.4991696574443,-122.381341478771 41.4991631608842,-122.381342934329 41.4991582559912,-122.381344196905 41.4991533247167,-122.381345628234 41.4991467171929,-122.38134675038 41.4991400791658,-122.381347398181 41.4991350868727,-122.38134785189 41.4991300835091,-122.38134819531 41.4991234075105,-122.381348262117 41.4991183964084,-122.381348132531 41.4991133904511,-122.381347699876 41.4991067205935,-122.381346954763 41.4991000751693,-122.381346206171 41.4990951045531,-122.381345260087 41.4990901561933,-122.381890409971 41.4990277373134,-122.38183704494 41.4992235626211,-122.381657775143 41.4993765310594,-122.381311197912 41.4992189298324))",| "geometry.coordinates": [[[[[-122.381311197912, 41.4992189298324], [-122.381315721263, 41.4992130721549], [-122.381319941184, 41.4992071434356], [-122.381323883846, 41.4992011129744], [-122.381327545682, 41.4991949852852], [-122.381330919547, 41.4991887675948], [-122.381334005495, 41.4991824689073], [-122.381336795188, 41.4991760973538], [-122.381339286258, 41.4991696574443], [-122.381341478771, 41.4991631608842], [-122.381342934329, 41.4991582559912], [-122.381344196905, 41.4991533247167], [-122.381345628234, 41.4991467171929], [-122.38134675038, 41.4991400791658], [-122.381347398181, 41.4991350868727], [-122.38134785189, 41.4991300835091], [-122.38134819531, 41.4991234075105], [-122.381348262117, 41.4991183964084], [-122.381348132531, 41.4991133904511], [-122.381347699876, 41.4991067205935], [-122.381346954763, 41.4991000751693], [-122.381346206171, 41.4990951045531], [-122.381345260087, 41.4990901561933], [-122.381890409971, 41.4990277373134], [-122.38183704494, 41.4992235626211], [-122.381657775143, 41.4993765310594], [-122.381311197912, 41.4992189298324]]]]]]  
117| | | | | "parcel_source": "unknown",| "pre-catastrophe.parcel-source":"Unknown",  
118| | | | | "sport_court": {|   
119| | | | | | "detected": null,| "pre-catastrophe.sport-court.detected":null,  
120| | | | | | "score": null| "pre-catastrophe.sport-court.score":null,  
121| | | | | },|   
122| | | | | "playground": {|   
123| | | | | | "detected": null,| "pre-catastrophe.playground.detected":null,  
124| | | | | | "score": null| "pre-catastrophe.playground.score":null,  
125| | | | | },|   
126| | | | | "deck": {|   
127| | | | | | "area": null,| 1.0 Only - not present in 2.0 - always null  
128| | | | | | "detected": null,| "pre-catastrophe.deck.detected":null,  
129| | | | | | "score": null| "pre-catastrophe.deck.score":null,  
130| | | | | },|   
131| | | | | "trampoline": {|   
132| | | | | | "detected": null,| "pre-catastrophe.trampoline.detected":null,  
133| | | | | | "score": null| "pre-catastrophe.trampoline.score":null,  
134| | | | | },|   
135| | | | | "enclosure": {|   
136| | | | | | "detected": null,| "pre-catastrophe.enclosure.detected":null,  
137| | | | | | "score": null| "pre-catastrophe.enclosure.score":null,  
138| | | | | },|   
139| | | | | "water_slide": {|   
140| | | | | | "detected": null,| "pre-catastrophe.pool.water-slide.detected":null,  
141| | | | | | "score": null| "pre-catastrophe.pool.water-slide.score":null,  
142| | | | | },|   
143| | | | | "diving_board": {|   
144| | | | | | "detected": null,| "pre-catastrophe.pool.diving-board.detected":null,  
145| | | | | | "score": null| "pre-catastrophe.pool.diving-board.score":null,  
146| | | | | },|   
147| | | | | "parcel_tree_cover": null,| 1.0 Only - not present in 2.0 - always null  
148| | | | | "hardscapes": null| 1.0 Only - not present in 2.0  
149| | | | }|   
150| | | },|   
151| | | "input_metadata": {|   
152| | | | "requested_wkt": "POINT (-122.381783 41.499072)",| "input-metadata.requested-wkt": "POINT (-122.381783 41.499072)",  
153| | | | "inside_parcel": true,| "input-metadata.inside-parcel": true  
154| | | | "request_id": null| 1.0 Only - not present in 2.0 - not applicable for cached records  
155| | | }|   
156| | }|   
157| ]|   
  
_Internal-only: Access the table here:_[_ElementsDamages-v1-to-v2.xlsx_](https://vexcelgroup.sharepoint.com/:x:/s/VexcelPlatform/Ee0oN5miSk5JrS6v_6LSx-8BpD7bHdWWaXi0kOMNjXuHGQ?e=u9JpR4)
