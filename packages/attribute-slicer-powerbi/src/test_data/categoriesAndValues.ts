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
                        "colorMode": 1,
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
    const clonedOptions = <powerbi.VisualUpdateOptions><any>_.cloneDeep(data);

    // Wont represent correctly with JSON stringify
    const values = clonedOptions.dataViews[0].categorical.values;

    (<any>values)["grouped"] = () => {
        return values.map((n, i) => {
            const v = _.cloneDeep(n);
            v["name"] = "GROUPED_" + i;
            // v["objects"] = objects[i] as any;
            return v;
        });
    };
    return {
        options: clonedOptions,
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
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 24.328593996840436
                },
                {
                    "color": "#FD625E",
                    "width": 0.8333333333333334
                }
            ]
        }, {
            raw: [0.47357142857142864, 14],
            total: 14.473571428571429,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 39.09952606635071
                },
                {
                    "color": "#FD625E",
                    "width": 10.833333333333334
                }
            ],
        }, {
            raw: [0.5294117647058824, 17],
            total: 17.529411764705884,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 45.27460273208809
                },
                {
                    "color": "#FD625E",
                    "width": 13.333333333333334
                }
            ],
        }, {
            raw: [0.4709523809523809, 21],
            total: 21.47095238095238,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 38.809899947340696
                },
                {
                    "color": "#FD625E",
                    "width": 16.666666666666664
                }
            ],
        }, {
            raw: [0.41500000000000004, 4],
            total: 4.415,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 32.62243285939969
                },
                {
                    "color": "#FD625E",
                    "width": 2.5
                }
            ],
        }, {
            raw: [0.5247540983606557, 61],
            total: 61.52475409836065,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 44.75953694351642
                },
                {
                    "color": "#FD625E",
                    "width": 50
                }
            ],
        }, {
            raw: [0.2866666666666667, 6],
            total: 6.286666666666667,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 18.43075302790943
                },
                {
                    "color": "#FD625E",
                    "width": 4.166666666666666
                }
            ],
        }, {
            raw: [0.12, 1],
            total: 1.12,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 0
                },
                {
                    "color": "#FD625E",
                    "width": 0
                }
            ],
        }, {
            raw: [0.5721428571428572, 14],
            total: 14.572142857142858,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 50
                },
                {
                    "color": "#FD625E",
                    "width": 10.833333333333334
                }
            ],
        }, {
            raw: [0.4315384615384615, 13],
            total: 13.431538461538462,
            renderedValue: 100,
            segments: [
                {
                    "color": "#01B8AA",
                    "width": 34.451330659861455
                },
                {
                    "color": "#FD625E",
                    "width": 10
                }
            ],
        }],
    };
};
