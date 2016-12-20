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

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as $ from "jquery";
import { AttributeSlicer as AttributeSlicerImpl } from "../AttributeSlicer";

import "../css/AttributeSlicer.scss";

export interface IAttributeSlicerProps {
    data: any[];
    serverSideSearch?: boolean;
    dimensions?: { width: number; height: number };
    showValues?: boolean;
    showSelections?: boolean;
    showHighlight?: boolean;
    onLoadMoreData(item: { result: boolean; }, isSearch: boolean, searchString: string): any;
    onCanLoadMoreData(item: { result: boolean; }, isSearch: boolean): any;
    onSelectionChanged(newItems: any[], oldItems: any[]): any;
};

export interface IAttributeSlicerState { }

/**
 * Thin wrapper around LineUp
 */
export class AttributeSlicer extends React.Component<IAttributeSlicerProps, IAttributeSlicerState> {
    public props: IAttributeSlicerProps;
    private mySlicer: AttributeSlicerImpl;
    private node: any;

    public componentDidMount() {
        this.node = ReactDOM.findDOMNode(this);
        this.mySlicer = new AttributeSlicerImpl($(this.node));
        this.attachEvents();
        this.renderContent();
    }

    public componentWillReceiveProps(newProps: IAttributeSlicerProps) {
        this.renderContent(newProps);
    }

    /**
     * Renders this component
     */
    public render() {
        return <div className="advanced-slicer-container" style={{width:"100%", height:"100%"}}></div>;
    }

    /**
     * Attaches events to the slicer
     */
    private attachEvents() {
        const guardedEventer = (evtName: string) => {
            return (...args: any[]) => {
                if (this.props[evtName]) {
                    this.props[evtName].apply(this, args);
                }
            };
        };
        this.mySlicer.events.on("loadMoreData", guardedEventer("onLoadMoreData"));
        this.mySlicer.events.on("canLoadMoreData", guardedEventer("onCanLoadMoreData"));
        this.mySlicer.events.on("selectionChanged", guardedEventer("onSelectionChanged"));
    }

    private renderContent(props?: IAttributeSlicerProps) {
        // if called from `componentWillReceiveProps`, then we use the new
        // props, otherwise use what we already have.
        props = props || this.props;

        this.mySlicer.showHighlight = props.showHighlight;
        this.mySlicer.showValues = props.showValues;
        this.mySlicer.showSelections = props.showSelections;
        this.mySlicer.serverSideSearch = props.serverSideSearch;
        this.mySlicer.data = props.data;
    }
}
