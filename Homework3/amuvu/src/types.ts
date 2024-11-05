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

export interface Parallel{
    subject: string;
    health: number;
    Dalc: number;
    Walc: number;
    G3: number;
    absences: number;
}

export interface StarCoordinate{
    subject: string;
    health: number;
    Dalc: number;
    Walc: number;
    G3: number;
    absences: number;
}

export interface Scatter{
    subject: string;
    weekday: number;
    education: number;
    parent: 'mother' | 'father';
}

export interface Heatmap {
    subject: string;
    weekday: number;
    schoolsup: boolean;
    famsup: boolean;
    paid: boolean;
    activities: boolean;
    higher: boolean;
    internet: boolean;
    romantic: boolean;
    [key: string]: any;
}