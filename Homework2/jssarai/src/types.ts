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
    readonly color: string;
}

export interface Bar{
    readonly value: number;
}

export interface Stream{
    readonly age: number;
    readonly low: number;
    readonly medium: number;
    readonly high: number;
    [key: string]: number
}

export interface Arc {
    readonly category: string;
    readonly percent: number;
}