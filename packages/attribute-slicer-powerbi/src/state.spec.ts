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
import '@essex/visual-testing-tools/lib/visualHelpers'; // tslint:disable-line
import state from "./state";
import { expect } from "chai";

describe("state", () => {
    describe("integration", () => {
        describe("receive", () => {
            const createInstance = () => {
                return {
                    instance: state.create() as state,
                };
            };
            // it("should deserialize colored instances correctly", () => {
            //     const { instance } = createInstance();
            //     const testSerializedIdentity = serializeIdentity(<any>{ "expr": {} });
            //     const testdeSerializedIdentity = deserializeIdentity(testSerializedIdentity);
            //     instance.colors.instanceColors = [{
            //         name: "SOME_MATCH",
            //         color: "#F0E0D0",
            //         identity: <any>testSerializedIdentity,
            //     }];
            //     const newInstance = instance.receive({ whatever: "DOESNT_MATTER" });

            //     // Make sure the new instance's colors are deserialized
            //     const colors = newInstance.colors.instanceColors;
            //     expect(colors).to.be.ok;
            //     expect(colors.length).to.be.equal(1);

            //     // Go through all the new colors and directly compare the identities to the deserialized one
            //     colors.forEach(n => {
            //         expect(n.identity).to.be.deep.equal(testdeSerializedIdentity);
            //     });
            // });

            describe("API Quirks", () => {
                // xit("should ensure that selected items have no null values", () => {
                //     const { instance } = createInstance();
                //     const testItem = <any>{
                //         id: "DOESNT_MATTER",
                //         selector: {
                //             data: [{
                //                 someExpr: null, // tslint:disable-line
                //             }],
                //         },
                //     };

                //     instance.selectedItems = [testItem];

                //     const newInstance = instance.receive({ whatever: "DOESNT_MATTER" });
                //     const parentObj = newInstance.selectedItems[0]["selector"].data[0];
                //     expect(parentObj.hasOwnProperty("someExpr")); // Make sure the key IS defined but the value is undefined
                //     expect(parentObj.someExpr).to.be.undefined;
                // });
            });
        });
        describe("toJSONObject", () => {
            const createInstance = () => {
                return {
                    instance: state.create() as state,
                };
            };
            // it("should serialize colored instances correctly", () => {
            //     const { instance } = createInstance();
            //     const testSerializedIdentity = serializeIdentity(<any>{ "expr": {} });
            //     const testdeSerializedIdentity = deserializeIdentity(testSerializedIdentity);
            //     instance.colors.instanceColors = [{
            //         name: "SOME_MATCH",
            //         color: "#F0E0D0",
            //         identity: <any>testdeSerializedIdentity,
            //     }];
            //     const colors = instance.toJSONObject().colors.instanceColors;
            //     expect(colors).to.be.ok;
            //     expect(colors.length).to.be.equal(1);

            //     // Make sure all the items are serialized properly
            //     colors.forEach(n => {
            //         expect(n.identity).to.be.deep.equal(testSerializedIdentity);
            //     });
            // });
        });
    });
});
