// Base layout interfaces
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

export interface Bar {
    readonly value: number;
}

// Filter and Hover State Management
export interface FilterState {
    selectedAge: string | null;
    selectedCondition: string | null;
    selectedTreatment: string | null;
}

export interface HoverState {
    element: {
        type: 'node' | 'link' | 'bar' | 'pie';
        category?: string;
        name: string;
        value: number;
        percentage?: number;
        coordinates: {
            x: number;
            y: number;
        };
        details?: Record<string, any>;
    } | null;
}

// Data Structures
export interface StudentData {
    Age: string;
    "Choose your gender": string;
    "What is your course?": string;
    "Your current year of Study": string;
    "What is your CGPA?": string;
    "Do you have Depression?": string;
    "Do you have Anxiety?": string;
    "Do you have Panic attack?": string;
    "Did you seek any specialist for a treatment?": string;
}

export interface ProcessedData {
    sankeyData: {
        nodes: NodeData[];
        links: LinkData[];
    };
    barData: EnhancedBar[];
    pieData: {
        male: PieSegment[];
        female: PieSegment[];
    };
    rawData: StudentData[];
}

// Sankey Chart Types
export interface NodeData {
    name: string;
    category: 'age' | 'condition' | 'treatment';
    index?: number;
    x0?: number;
    x1?: number;
    y0?: number;
    y1?: number;
    value?: number;
}

export interface LinkData {
    source: number | NodeData;
    target: number | NodeData;
    value: number;
    width?: number;
}

// Bar Chart Types
export interface EnhancedBar extends Bar {
    category: string;
    label: string;
    color: string;
    percentage: number;
    condition?: string;
}

// Pie Chart Types
export interface PieSegment {
    id: string;
    value: number;
    label: string;
    percentage: number;
    color: string;
}

export interface GenderData {
    male: MentalHealthCount[];
    female: MentalHealthCount[];
}

export interface MentalHealthCount {
    condition: string;
    count: number;
    percentage: number;
}

// Component Props
export interface ChartProps {
    filters: FilterState;
    onElementHover: (element: HoverState['element'] | null, event: React.MouseEvent) => void;
    isTransitioning: boolean;
}

export interface SankeyProps extends ChartProps {
    onNodeSelect: (node: NodeData) => void;
}

// Color Schemes
export interface ColorScheme {
    age: {
        [key: string]: string;
    };
    condition: {
        [key: string]: string;
    };
    treatment: {
        [key: string]: string;
    };
}

// Chart Configuration
export interface ChartDimensions extends ComponentSize {
    margin: Margin;
    boundedWidth: number;
    boundedHeight: number;
}

export interface TooltipConfig {
    position: Point;
    content: {
        title: string;
        values: Array<{
            label: string;
            value: string | number;
        }>;
    };
}

// Animation Configuration
export interface TransitionConfig {
    duration: number;
    ease: string;
}

// Event Handlers
export interface ChartEventHandlers {
    onHover?: (element: HoverState['element'] | null, event: React.MouseEvent) => void;
    onClick?: (element: any) => void;
    onMouseLeave?: () => void;
}

// Chart Scales
export interface ChartScales {
    xScale: any;  // d3 scale
    yScale: any;  // d3 scale
    colorScale: any;  // d3 scale
}

// Legend Configuration
export interface LegendConfig {
    position: Point;
    orientation: 'horizontal' | 'vertical';
    items: Array<{
        label: string;
        color: string;
    }>;
}

// Update Triggers
export interface UpdateTriggers {
    data?: boolean;
    dimensions?: boolean;
    scales?: boolean;
    filters?: boolean;
}

// Accessibility Configuration
export interface AccessibilityConfig {
    title: string;
    description: string;
    ariaLabel: string;
}

// Data Processing Types
export interface DataProcessor {
    processData: (data: StudentData[]) => ProcessedData;
    filterData: (data: ProcessedData, filters: FilterState) => ProcessedData;
}

// Chart State
export interface ChartState {
    data: ProcessedData | null;
    dimensions: ChartDimensions | null;
    scales: ChartScales | null;
    isLoading: boolean;
    error: string | null;
}

// Theme Configuration
export interface ThemeConfig {
    colors: ColorScheme;
    fonts: {
        primary: string;
        secondary: string;
    };
    spacing: {
        padding: number;
        margin: number;
    };
}