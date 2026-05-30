declare module "react-simple-maps" {
  import { FC, ReactNode, MouseEvent } from "react";

  export interface ProjectionConfig {
    scale?:  number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  export interface ComposableMapProps {
    projection?:       string;
    projectionConfig?: ProjectionConfig;
    style?:            React.CSSProperties;
    className?:        string;
    children?:         ReactNode;
  }
  export const ComposableMap: FC<ComposableMapProps>;

  export interface GeographiesProps {
    geography: string | object;
    children:  (props: { geographies: any[] }) => ReactNode;
  }
  export const Geographies: FC<GeographiesProps>;

  export interface GeographyStyle {
    default?: React.CSSProperties;
    hover?:   React.CSSProperties;
    pressed?: React.CSSProperties;
  }

  export interface GeographyProps {
    geography:     any;
    fill?:         string;
    stroke?:       string;
    strokeWidth?:  number;
    style?:        GeographyStyle;
    className?:    string;
    onMouseEnter?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGPathElement>) => void;
    onClick?:      (event: MouseEvent<SVGPathElement>) => void;
  }
  export const Geography: FC<GeographyProps>;

  export interface MarkerProps {
    coordinates: [number, number];
    children?:   ReactNode;
    onMouseEnter?: (event: MouseEvent<SVGGElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGGElement>) => void;
    onClick?:      (event: MouseEvent<SVGGElement>) => void;
  }
  export const Marker: FC<MarkerProps>;
}
