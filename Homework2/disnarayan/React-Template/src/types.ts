export interface Margin {
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
}

export interface ComponentSize {
  width: number
  height: number
}

export interface CategoricalBar {
  category: string
  value: number
}
export interface MentalHealthData {
  condition: string;
  trueCount: number;
  falseCount: number;
}
