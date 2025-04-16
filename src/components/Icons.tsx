import type { SVGProps } from "react";


type IconSvgBaseProps = {
    children: React.ReactElement<SVGProps<SVGElement>> | React.ReactElement<SVGProps<SVGElement>>[],
    width?: number,
    height?: number,
    fill?: string,
}


const IconSvgBase = ({ children, width = 24, height = 24, fill = "black" }: IconSvgBaseProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height={`${height}px`} viewBox="0 -960 960 960" width={`${width}px`} fill={`${fill}`}>
            {children}
        </svg>
    )
}

const IconDarkMode = () => (
    <IconSvgBase>
        <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm40-83q119-15 199.5-104.5T800-480q0-123-80.5-212.5T520-797v634Z" />
    </IconSvgBase>
)

const IconBackArrow = ({ fill, width = 24, height = 24 }: Omit<IconSvgBaseProps, "children">) => (
    <IconSvgBase fill={fill} width={width} height={height}>
        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
    </IconSvgBase>
)

const IconOpenInNew = ({ fill, width = 24, height = 24 }: Omit<IconSvgBaseProps, "children">) => (
    <IconSvgBase fill={fill} width={width} height={height}>
        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
    </IconSvgBase>
)



export { IconDarkMode, IconBackArrow, IconOpenInNew };