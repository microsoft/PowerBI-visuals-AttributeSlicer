/*
 * Copyright (c) Microsoft
 * All rights reserved.
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* tslint:disable */
const data = {
    "viewport": {
        "width": 482.3076923076923,
        "height": 277.0903010033445
    },
    "viewMode": 1,
    "type": 4,
    "dataViews": [
        {
            "metadata": {
                "objects": {
                    "display": {
                        "horizontal": false,
                        "valueColumnWidth": 66,
                        "labelDisplayUnits": 0,
                        "labelPrecision": 0
                    },
                    "general": {
                        "selection": "[]",
                        "textSize": 9,
                        "showOptions": true
                    },
                    "selection": {
                        "singleSelect": false,
                        "brushMode": false,
                        "showSelections": true
                    },
                    "dataPoint": {
                        "useGradient": true,
                        "startColor": {
                            "solid": {
                                "color": "#bac2ff"
                            }
                        },
                        "endColor": {
                            "solid": {
                                "color": "#FD625E"
                            }
                        }
                    }
                },
                "columns": [
                    {
                        "roles": {
                            "Category": true
                        },
                        "type": {
                            "underlyingType": 1,
                            "category": <any>null
                        },
                        "displayName": "attribute",
                        "queryName": "Attributes.attribute",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Attributes",
                                "variable": "a"
                            },
                            "ref": "attribute"
                        }
                    },
                    {
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 260,
                            "category": <any>null
                        },
                        "displayName": "Count of doc_id",
                        "queryName": "CountNonNull(Attributes.doc_id)",
                        "expr": {
                            "_kind": 4,
                            "arg": {
                                "_kind": 2,
                                "source": {
                                    "_kind": 0,
                                    "entity": "Attributes",
                                    "variable": "a"
                                },
                                "ref": "doc_id"
                            },
                            "func": 5
                        }
                    },
                    {
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 259,
                            "category": <any>null
                        },
                        "displayName": "Average of certainty",
                        "queryName": "Sum(Attributes.certainty)",
                        "expr": {
                            "_kind": 4,
                            "arg": {
                                "_kind": 2,
                                "source": {
                                    "_kind": 0,
                                    "entity": "Attributes",
                                    "variable": "a"
                                },
                                "ref": "certainty"
                            },
                            "func": 1
                        }
                    }
                ]
            },
            "categorical": {
                "categories": [
                    {
                        "source": {
                            "roles": {
                                "Category": true
                            },
                            "type": {
                                "underlyingType": 1,
                                "category": <any>null
                            },
                            "displayName": "attribute",
                            "queryName": "Attributes.attribute",
                            "expr": {
                                "_kind": 2,
                                "source": {
                                    "_kind": 0,
                                    "entity": "Attributes",
                                    "variable": "a"
                                },
                                "ref": "attribute"
                            }
                        },
                        "identity": [
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "AED",
                                        "valueEncoded": "'AED'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"AED\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "AFN",
                                        "valueEncoded": "'AFN'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"AFN\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "ALL",
                                        "valueEncoded": "'ALL'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"ALL\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "AMD",
                                        "valueEncoded": "'AMD'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"AMD\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "AOA",
                                        "valueEncoded": "'AOA'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"AOA\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "ARS",
                                        "valueEncoded": "'ARS'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"ARS\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "AUD",
                                        "valueEncoded": "'AUD'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"AUD\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "AWG",
                                        "valueEncoded": "'AWG'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"AWG\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "AZN",
                                        "valueEncoded": "'AZN'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"AZN\"}}}}"
                                }
                            },
                            {
                                "_expr": {
                                    "_kind": 13,
                                    "comparison": 0,
                                    "left": {
                                        "_kind": 2,
                                        "source": {
                                            "_kind": 0,
                                            "entity": "Attributes"
                                        },
                                        "ref": "attribute"
                                    },
                                    "right": {
                                        "_kind": 17,
                                        "type": {
                                            "underlyingType": 1,
                                            "category": <any>null
                                        },
                                        "value": "BAM",
                                        "valueEncoded": "'BAM'"
                                    }
                                },
                                "_key": {
                                    "factoryMethod": <any>null,
                                    "value": "{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Attributes\"},\"r\":\"attribute\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"BAM\"}}}}"
                                }
                            }
                        ],
                        "identityFields": [
                            {
                                "_kind": 2,
                                "source": {
                                    "_kind": 0,
                                    "entity": "Attributes"
                                },
                                "ref": "attribute"
                            }
                        ],
                        "values": [
                            "AED",
                            "AFN",
                            "ALL",
                            "AMD",
                            "AOA",
                            "ARS",
                            "AUD",
                            "AWG",
                            "AZN",
                            "BAM"
                        ]
                    }
                ],
                "values": [
                    {
                        "source": {
                            "roles": {
                                "Values": true
                            },
                            "type": {
                                "underlyingType": 259,
                                "category": <any>null
                            },
                            "displayName": "Average of certainty",
                            "queryName": "Sum(Attributes.certainty)",
                            "expr": {
                                "_kind": 4,
                                "arg": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Attributes",
                                        "variable": "a"
                                    },
                                    "ref": "certainty"
                                },
                                "func": 1
                            }
                        },
                        "values": [
                            0.33999999999999997,
                            0.47357142857142864,
                            0.5294117647058824,
                            0.4709523809523809,
                            0.41500000000000004,
                            0.5247540983606557,
                            0.2866666666666667,
                            0.12,
                            0.5721428571428572,
                            0.4315384615384615
                        ],
                        "maxLocal": 0.91,
                        "minLocal": 0.01
                    },
                    {
                        "source": {
                            "roles": {
                                "Values": true
                            },
                            "type": {
                                "underlyingType": 260,
                                "category": <any>null
                            },
                            "displayName": "Count of doc_id",
                            "queryName": "CountNonNull(Attributes.doc_id)",
                            "expr": {
                                "_kind": 4,
                                "arg": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Attributes",
                                        "variable": "a"
                                    },
                                    "ref": "doc_id"
                                },
                                "func": 5
                            }
                        },
                        "values": [
                            2,
                            14,
                            17,
                            21,
                            4,
                            61,
                            6,
                            1,
                            14,
                            13
                        ],
                        "maxLocal": 779,
                        "minLocal": 1
                    }
                ]
            }
        }
    ]
}

import { IAttributeSlicerSegmentInfo } from "../interfaces";
import * as _ from "lodash";
export default function dataWithCategoriesAndValues() {
    "use strict";
    return {
        options: <powerbi.VisualUpdateOptions><any>_.cloneDeep(data),
        // These are the categories that this data has
        categories: ["AED", "AFN", "ALL", "AMD", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM"],
        segmentInfos: [{
            name: "1",
            color: "#01B8AA", // These colors come from the default pallete in PBI
            identity: undefined,
        }, {
            name: "2",
            color: "#FD625E",
            identity: undefined,
        }] as IAttributeSlicerSegmentInfo[],

        
        // Each one of these maps to a category, with 2 segments
        // it is basically the values that the slicer should be showing
        values: [{
            raw: [0.33999999999999997, 2],
            total: 2.34,
            renderedValue: 11.81773772013385,
            segments: [{ 
                width: 14.529914529914528,
                color: "#01B8AA", 
            }, { 
                width: 85.47008547008548,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.47357142857142864, 14],
            total: 14.473571428571429,
            renderedValue: 29.896139741160624,
            segments: [{ 
                width: 3.271973547845828,
                color: "#01B8AA", 
            }, { 
                width: 96.72802645215417,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.5294117647058824, 17],
            total: 17.529411764705884,
            renderedValue: 34.44918584419186,
            segments: [{ 
                width: 3.0201342281879193,
                color: "#01B8AA", 
            }, { 
                width: 96.97986577181207,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.4709523809523809, 21],
            total: 21.47095238095238,
            renderedValue: 40.32188015041389,
            segments: [{ 
                width: 2.193439641597729,
                color: "#01B8AA", 
            }, { 
                width: 97.80656035840227,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.41500000000000004, 4],
            total: 4.415,
            renderedValue: 14.909381793312328,
            segments: [{ 
                width: 9.39977349943375,
                color: "#01B8AA", 
            }, { 
                width: 90.60022650056625,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.5247540983606557, 61],
            total: 61.52475409836065,
            renderedValue: 100,
            segments: [{ 
                width: 0.8529153932443557,
                color: "#01B8AA", 
            }, { 
                width: 99.14708460675566,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.2866666666666667, 6],
            total: 6.286666666666667,
            renderedValue: 17.698069579801828,
            segments: [{ 
                width: 4.559915164369035,
                color: "#01B8AA", 
            }, { 
                width: 95.44008483563096,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.12, 1],
            total: 1.12,
            renderedValue: 10,
            segments: [{ 
                width: 10.714285714285712,
                color: "#01B8AA", 
            }, { 
                width: 89.28571428571428,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.5721428571428572, 14],
            total: 14.572142857142858,
            renderedValue: 30.043006137752236,
            segments: [{ 
                width: 3.9262781236213913,
                color: "#01B8AA", 
            }, { 
                width: 96.0737218763786,
                color: "#FD625E", 
            }],
        }, {
            raw: [0.4315384615384615, 13],
            total: 13.431538461538462,
            renderedValue: 28.343563815096022,
            segments: [{ 
                width: 3.212874405818681,
                color: "#01B8AA", 
            }, { 
                width: 96.7871255941813,
                color: "#FD625E", 
            }],
        }],
    };
};
