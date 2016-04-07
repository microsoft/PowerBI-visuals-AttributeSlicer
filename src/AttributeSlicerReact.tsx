import * as React from "react";
import * as ReactDOM from "react-dom";
import * as $ from "jquery";
import { AttributeSlicer as AttributeSlicerImpl } from "./AttributeSlicer";

import "./css/AttributeSlicer.scss";

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
