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

export interface VehicleData{
    readonly year: number;
    readonly sellingprice: number;
    readonly mmr: number;
    readonly condition: number;
    readonly odometer: number;
    readonly make: string;
    profit: number;
}

export interface PlotProps {
    data: VehicleData[];
}