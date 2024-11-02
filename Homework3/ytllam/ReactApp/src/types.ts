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
  'Gabriel Pereira' = 'GP',
  'Mousinho Da Silveira' = 'MS',
}

export enum SexEnum {
  Male = 'M',
  Female = 'F',
}

export enum AddressEnum {
  Urban = 'U',
  Rural = 'R',
}

export enum FamSizeEnum {
  '<=3' = 'LE3',
  '>3' = 'GT3',
}

export enum ParentStatusEnum {
  Together = 'T',
  Apart = 'A',
}

export enum EducationEnum {
  'None' = '0',
  'Fourth Grade' = '1',
  'Ninth Grade' = '2',
  'Secondary Ed' = '3',
  'Higher Ed' = '4',
}

export enum JobEnum {
  'Teacher' = 'teacher',
  'Health Care' = 'health',
  'Civil Services' = 'services',
  'Stay At Home' = 'at_home',
  'Other' = 'other',
}

export enum SchoolReasonEnum { 
  'Close To Home' = 'home',
  'Reputation' = 'reputation',
  'CoursePreference' = 'course',
  'Other' = 'other',
}

export enum GuardianEnum {
  Mother = 'mother',
  Father = 'father',
  Other = 'other',
}

export enum TravelTimeEnum {
  '< 15 min' = '1',
  '15-30 min' = '2',
  '30 min - 1 h' = '3',
  '> 1 h' = '4',
}

export enum WeeklyStudyTimeEnum {
  '< 2 h' = '1',
  '2-5 h' = '2',
  '5-10 h' = '3',
  '> 10 h' = '4',
}

export enum NumClassesFailedEnum {
  'never' = '0',
  'once' = '1',
  'twice' = '2',
  'thrice+' = '3',
}

export enum QualityEnum {
  'Very Bad' = '1',
  'Bad' = '2',
  'Average' = '3',
  'Good' = '4',
  'Very Good' = '5',
}

export enum FrequencyEnum {
  'Very Low' = '1',
  'Low' = '2',
  'Average' = '3',
  'High' = '4',
  'Very High' = '5'
}

export enum BooleanEnum {
  'Yes' = 'yes',
  'No' = 'no',
}

export enum GradeTrendEnum {
  Declined = "0",
  Fluctuated = "1",
  Maintained = "2",
  Improved = "3",
  // FluctuatedImproved = "2",
  // FluctuatedDeclined = "3",
  // FluctuatedMaintained = "4",
  // Unknown = "6",
  
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
  readonly gradeTrend: GradeTrendEnum;
}

export const COL_TO_ENUM_MAP = new Map(Object.entries({
  'school': SchoolEnum,
  'sex': SexEnum,
  'address': AddressEnum,
  'famSize': FamSizeEnum,
  'parentStatus': ParentStatusEnum,
  'motherEdu': EducationEnum,
  'fatherEdu': EducationEnum,
  'motherJob': JobEnum,
  'fatherJob': JobEnum,
  'reason': SchoolReasonEnum,
  'guardian': GuardianEnum,
  'travelTime': TravelTimeEnum,
  'studyTime': WeeklyStudyTimeEnum,
  'failures': NumClassesFailedEnum,
  'schoolSup': BooleanEnum,
  'famSup': BooleanEnum,
  'paid': BooleanEnum,
  'activities': BooleanEnum,
  'nursery': BooleanEnum,
  'higher': BooleanEnum,
  'internet': BooleanEnum,
  'romantic': BooleanEnum,
  'famRel': QualityEnum,
  'freeTime': FrequencyEnum,
  'goOut': FrequencyEnum,
  'weekdayAlc': FrequencyEnum,
  'weekendAlc': FrequencyEnum,
  'health': QualityEnum,
  'gradeTrend': GradeTrendEnum,
}));

// issue: node ids need to be unique.
export const ALL_NODES = Array.from(COL_TO_ENUM_MAP)
  // for every column
  .flatMap(([col, colType]) => Object.entries(colType) // Object.entries() returns array of [name, value] pairs.
    // map over column's enum type to create nodes for all possible values
    .flatMap(([enumEntryName, enumEntryValue]) => ({
        'column': col,
        'id': col + enumEntryValue, // id needs to be unique among nodes, so we need to prepend column name.
        'val': enumEntryValue, // value in csv. we use 'val' since the 'value' key is used by d3-sankey.
        'label': enumEntryName // label for displaying on chart.
      })
    )
  );
export const NUMBER_COLUMNS = 33;