# Nearby Category Mapping

Every key below is explicitly supported. Unknown keys return `INVALID_CATEGORY`; no broad search or fabricated fallback is used. Google types are Places API New Table A types. OSM clauses are constructed only from this registry.

| Naero key | Google Places New types | OSM tags | Fallback | Confidence |
|---|---|---|---|---|
| `immigration_office` | `government_office` | `office=government`, `government=immigration` | OSM | Medium |
| `government_office` | `government_office` | `office=government` | OSM | High |
| `legal_aid` | `lawyer` | `office=lawyer`, `social_facility=outreach` | OSM | Medium |
| `ngo` | Unsupported | `office=ngo`, `office=association` | OSM only | Medium |
| `translator` | Unsupported | `office=translator` | OSM only | High |
| `hospital` | `hospital` | `amenity=hospital` | OSM | High |
| `clinic` | `medical_clinic` | `amenity=clinic` | OSM | High |
| `pharmacy` | `pharmacy` | `amenity=pharmacy` | OSM | High |
| `police` | `police` | `amenity=police` | OSM | High |
| `emergency` | `hospital` | `emergency=yes`, `emergency=ambulance_station` | OSM | Medium |
| `shelter` | Unsupported | `amenity=shelter`, `social_facility=shelter` | OSM only | Medium |
| `community_center` | `community_center` | `amenity=community_centre` | OSM | High |
| `job_center` | `employment_agency` | `office=employment_agency`, `social_facility=employment` | OSM | Medium |
| `school` | `school` | `amenity=school` | OSM | High |
| `language_school` | `school` | `amenity=language_school`, `training=language` | OSM | Medium |
| `public_transport` | `transit_station`, `bus_station`, `train_station` | `public_transport=station`, `amenity=bus_station`, `railway=station` | OSM | High |
| `bank` | `bank` | `amenity=bank` | OSM | High |
| `atm` | `atm` | `amenity=atm` | OSM | High |
| `post_office` | `post_office` | `amenity=post_office` | OSM | High |
| `supermarket` | `supermarket` | `shop=supermarket` | OSM | High |
| `halal_food` | `halal_restaurant` | `diet:halal=yes`, `cuisine=halal` | OSM | Medium |
| `religious_center` | `church`, `mosque`, `synagogue`, `hindu_temple`, `buddhist_temple` | `amenity=place_of_worship` | OSM | High |
| `childcare` | `child_care_agency` | `amenity=childcare` | OSM | High |
| `social_services` | Unsupported | `office=social_services`, `social_facility=service` | OSM only | Medium |

Google is attempted first only where a supported mapping exists. An unsupported Google mapping does not make the Naero category unsupported when a precise OSM mapping exists.
