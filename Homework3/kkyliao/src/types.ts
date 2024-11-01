// Global types and interfaces are stored here.
export interface Margin {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

export interface ComponentSize {
    width: number;
    height: number;
}

export interface Point {
    readonly posX: number;
    readonly posY: number;
}

export interface Bar{
    readonly value: number;
}

// export interface SankeyNode {
//     name: string;
//     id: number;
//     category: string;
//     x?: number;
//     y?: number;
//     color?: string;
// }

// export interface SankeyLink {
//     source: number;
//     target: number;
//     value: number;
// }

export interface SankeyNode {
    name: string;      // Display name of the node
    id: number;        // Unique ID for referencing in links
    category?: string; // Optional grouping for colors
    color?: string;    // Optional color property
}

export interface SankeyLink {
    source: number;     // ID of the source node, or the node object itself
    target: number;     // ID of the target node, or the node object itself
    value: number;      // Weight of the link
    color?: string;     // Optional color property for the link
}

export interface NumbericalData {
    Income: number;
    CreditScore: number;
    LoanAmount: number;
    AssetsValue: number;
    RiskRating: string;
    [key: string]: number | string;
}

// Represents a single node in the sunburst hierarchy
export interface SunburstNode {
    name: string;                    // Name of the node (e.g., "Low Risk", "Single")
    value?: number;                  // Optional value for leaf nodes
    children?: SunburstNode[];       // Children nodes, if any
}

// Represents the full dataset for the sunburst chart
export interface SunburstData {
    name: string;                    // Root name (e.g., "Risk Categories")
    children: SunburstNode[];        // Top-level nodes (e.g., risk ratings)
}

