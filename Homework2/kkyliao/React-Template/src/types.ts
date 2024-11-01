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

export interface SankeyNode {
    name: string;
    id: number;
    category: string;
    x?: number;
    y?: number;
    color?: string;
}

export interface SankeyLink {
    source: number;
    target: number;
    value: number;
}

export interface NumbericalData {
    Income: number;
    CreditScore: number;
    LoanAmount: number;
    AssetsValue: number;
    RiskRating: string;
    [key: string]: number | string;
}

export interface CountryCreditScore {
    Country: string;
    AvgCreditScore: number;
}