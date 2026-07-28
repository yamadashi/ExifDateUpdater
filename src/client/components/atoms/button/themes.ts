import { CSSInterpolation } from '@emotion/serialize'
import colors from '@styles/colors.json'

export type Theme = 'primary' | 'secondary' | 'normal' | 'warning' | 'none'

const primary: CSSInterpolation = {
  color: colors.brightestColor,
  backgroundColor: colors.primaryColor,
  border: `1px solid ${colors.primaryColor}`,
  '&:hover': {
    backgroundColor: colors.primaryHoverColor,
    border: `1px solid ${colors.primaryHoverColor}`,
  },
  '&:focus': {
    backgroundColor: colors.primaryColor,
    border: `2px solid ${colors.focusColor}`,
  },
  '&:active': {
    backgroundColor: colors.primaryHoverColor,
    border: `2px solid ${colors.primaryHoverColor}`,
  },
  '&:disabled': {
    backgroundColor: colors.primaryDisabledColor,
    border: `1px solid ${colors.primaryDisabledColor}`,
    cursor: 'default',
  },
}

const secondary: CSSInterpolation = {
  color: colors.primaryColor,
  backgroundColor: colors.brightestColor,
  border: `1px solid ${colors.primaryColor}`,
  '&:hover': {
    color: colors.primaryHoverColor,
    backgroundColor: colors.brightestColor,
    border: `1px solid ${colors.primaryHoverColor}`,
  },
  '&:focus': {
    color: colors.focusColor,
    backgroundColor: colors.brightestColor,
    border: `2px solid ${colors.focusColor}`,
  },
  '&:active': {
    color: colors.primaryHoverColor,
    backgroundColor: colors.secondaryActiveColor,
    border: `1px solid ${colors.primaryHoverColor}`,
  },
  '&:disabled': {
    color: colors.primaryDisabledColor,
    backgroundColor: colors.secondaryActiveColor,
    border: `1px solid ${colors.borderColor}`,
    cursor: 'default',
  },
}

const normal: CSSInterpolation = {
  color: colors.defaultTextColor,
  backgroundColor: colors.brightestColor,
  border: `1px solid ${colors.borderColor}`,
  '&:hover': {
    color: colors.defaultTextColor,
    backgroundColor: colors.brightestColor,
    border: `1px solid ${colors.primaryHoverColor}`,
  },
  '&:focus': {
    color: colors.defaultTextColor,
    backgroundColor: colors.brightestColor,
    border: `2px solid ${colors.focusColor}`,
  },
  '&:active': {
    color: colors.primaryHoverColor,
    backgroundColor: colors.secondaryActiveColor,
    border: `1px solid ${colors.primaryHoverColor}`,
  },
  '&:disabled': {
    color: colors.primaryDisabledColor,
    backgroundColor: colors.secondaryActiveColor,
    border: `1px solid ${colors.borderColor}`,
    cursor: 'default',
    pointerEvents: 'none',
  },
}

const warning: CSSInterpolation = {
  color: colors.brightestColor,
  backgroundColor: colors.errorColor,
  border: `1px solid ${colors.errorColor}`,
  '&:hover': {
    color: colors.brightestColor,
    backgroundColor: colors.impactColor,
    border: `1px solid ${colors.impactColor}`,
  },
  '&:focus': {
    color: colors.brightestColor,
    backgroundColor: colors.errorColor,
    border: `2px solid ${colors.focusColor}`,
  },
  '&:active': {
    color: colors.brightestColor,
    backgroundColor: colors.impactColor,
    border: `1px solid ${colors.impactColor}`,
  },
  '&:disabled': {
    color: colors.brightestColor,
    backgroundColor: colors.primaryDisabledColor,
    border: `1px solid ${colors.primaryDisabledColor}`,
    cursor: 'default',
  },
}

export const THEMES: Record<Theme, CSSInterpolation> = {
  primary,
  secondary,
  normal,
  warning,
  none: {},
}
