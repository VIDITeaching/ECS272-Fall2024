// Global types and interfaces are stored here.
/**
 * Types for Components and HTML elements
 */
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

/**
 * Types for CSV data
 */

export enum SchoolEnum {
    GabrielPereira = "GP",
    MousinhoDaSilveira = "MS"
}

export enum SexEnum {
    Male = "M",
    Female = "F"
}

export enum AddressEnum {
    Urban = "U",
    Rural = "R"
}

export enum FamSizeEnum {
    ThreeOrLess = "LE3",
    MoreThanThree = "GT3"
}

export enum ParentStatusEnum {
    Together = "T",
    Apart = "A"
}

export enum EducationEnum {
    None = "0",
    FourthGrade = "1",
    NinthGrade = "2",
    SecondaryEd = "3",
    HigherEd = "4"
}

export enum JobEnum {
    Teacher = "teacher",
    HealthCare = "health",
    CivilServices = "services",
    StayAtHome = "at_home",
    Other = "other"
}

export enum SchoolReasonEnum { 
    CloseToHome = "home",
    Reputation = "reputation",
    CoursePreference = "course",
    Other = "other"
}

export enum GuardianEnum {
    Mother = "mother",
    Father = "father",
    Other = "other"
}

export enum TravelTimeEnum {
    LessThanFifteenMins = "1",
    FifteenToThirtyMins = "2",
    ThirtyMinsToOneHour = "3",
    MoreThanOneHour = "4"
}

export enum WeeklyStudyTimeEnum {
    LessThanTwoHours = "1",
    TwoToFiveHours = "2",
    FiveToTenHours = "3",
    MoreThanTenHours = "4"
}

export enum NumClassesFailedEnum {
    One = "1",
    Two = "2",
    ThreeOrMore = "3"
}

export enum QualityEnum {
    VeryBad = "1",
    Bad = "2",
    Average = "3",
    Good = "4",
    VeryGood = "5"
}

export enum FrequencyEnum {
    VeryLow = "1",
    Low = "2",
    Average = "3",
    High = "4",
    VeryHigh = "5"
}

export interface DataRow {
    // readonly columns: string;
    [index: string] : string | boolean | number | null | undefined;
    readonly school: SchoolEnum;
    readonly sex: SexEnum;
    readonly age: number;
    readonly address: AddressEnum;
    readonly famSize: FamSizeEnum;
    readonly parentStatus: ParentStatusEnum;
    readonly motherEdu: EducationEnum;
    readonly fatherEdu: EducationEnum;
    readonly motherJob: JobEnum;
    readonly fatherJob: JobEnum;
    readonly reason: SchoolReasonEnum;
    readonly guardian: GuardianEnum;
    readonly travelTime: TravelTimeEnum;
    readonly studyTime: WeeklyStudyTimeEnum;
    readonly failures: NumClassesFailedEnum;
    readonly schoolSup: boolean;
    readonly famSup: boolean;
    readonly paid: boolean;
    readonly activities: boolean;
    readonly nursery: boolean;
    readonly higher: boolean;
    readonly internet: boolean;
    readonly romantic: boolean;
    readonly famRel: QualityEnum;
    readonly freeTime: FrequencyEnum;
    readonly goOut: FrequencyEnum;
    readonly weekdayAlc: FrequencyEnum;
    readonly weekendAlc: FrequencyEnum;
    readonly health: QualityEnum;
    readonly absences: number;
    readonly G1: number;
    readonly G2: number;
    readonly G3: number;
}

export const NUMBER_COLUMNS = 33;