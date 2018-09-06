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
  viewport: {
    width: 387.27090301003346,
    height: 263.39130434782606,
  },
  viewMode: 1,
  type: 4,
  dataViews: [
    {
      metadata: {
        objects: {
          display: {
            horizontal: false,
            valueColumnWidth: 66,
            labelDisplayUnits: 0,
            labelPrecision: 0,
          },
          general: {
            selection: '[]',
            textSize: 9,
            showOptions: true,
          },
          selection: {
            singleSelect: false,
            brushMode: false,
            showSelections: true,
          },
          dataPoint: {
            colorMode: 1,
            startColor: {
              solid: {
                color: '#bac2ff',
              },
            },
            endColor: {
              solid: {
                color: '#FD625E',
              },
            },
          },
        },
        columns: [
          {
            roles: {
              Category: true,
            },
            type: {
              underlyingType: 1,
              category: <any>null,
            },
            displayName: 'attribute',
            queryName: 'Attributes.attribute',
            expr: {
              _kind: 2,
              source: {
                _kind: 0,
                entity: 'Attributes',
                variable: 'a',
              },
              ref: 'attribute',
            },
          },
        ],
      },
      categorical: {
        categories: [
          {
            source: {
              roles: {
                Category: true,
              },
              type: {
                underlyingType: 1,
                category: <any>null,
              },
              displayName: 'attribute',
              queryName: 'Attributes.attribute',
              expr: {
                _kind: 2,
                source: {
                  _kind: 0,
                  entity: 'Attributes',
                  variable: 'a',
                },
                ref: 'attribute',
              },
            },
            identity: [
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'AED',
                    valueEncoded: "'AED'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"AED"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'AFN',
                    valueEncoded: "'AFN'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"AFN"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'ALL',
                    valueEncoded: "'ALL'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"ALL"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'AMD',
                    valueEncoded: "'AMD'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"AMD"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'AOA',
                    valueEncoded: "'AOA'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"AOA"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'ARS',
                    valueEncoded: "'ARS'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"ARS"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'AUD',
                    valueEncoded: "'AUD'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"AUD"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'AWG',
                    valueEncoded: "'AWG'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"AWG"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'AZN',
                    valueEncoded: "'AZN'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"AZN"}}}}',
                },
              },
              {
                _expr: {
                  _kind: 13,
                  comparison: 0,
                  left: {
                    _kind: 2,
                    source: {
                      _kind: 0,
                      entity: 'Attributes',
                    },
                    ref: 'attribute',
                  },
                  right: {
                    _kind: 17,
                    type: {
                      underlyingType: 1,
                      category: <any>null,
                    },
                    value: 'BAM',
                    valueEncoded: "'BAM'",
                  },
                },
                _key: {
                  factoryMethod: <any>null,
                  value:
                    '{"comp":{"k":0,"l":{"col":{"s":{"e":"Attributes"},"r":"attribute"}},"r":{"const":{"t":1,"v":"BAM"}}}}',
                },
              },
            ],
            identityFields: [
              {
                _kind: 2,
                source: {
                  _kind: 0,
                  entity: 'Attributes',
                },
                ref: 'attribute',
              },
            ],
            values: [
              'AED',
              'AFN',
              'ALL',
              'AMD',
              'AOA',
              'ARS',
              'AUD',
              'AWG',
              'AZN',
              'BAM',
            ],
          },
        ],
      },
    },
  ],
};

import cloneDeep = require('lodash.clonedeep');
export default function dataWithOnlyCategories() {
  const clonedOptions = cloneDeep(data) as any;

  'use strict';
  return {
    options: clonedOptions,
    // These are the categories that this data has
    categories: [
      'AED',
      'AFN',
      'ALL',
      'AMD',
      'AOA',
      'ARS',
      'AUD',
      'AWG',
      'AZN',
      'BAM',
    ],
  };
}
