import { css } from '@emotion/react'

type TextfieldType = 'text' | 'number' | 'tel' | 'email' | 'password'

const Textfield = <
  Type extends TextfieldType = 'text',
  ValueType extends number | string = Type extends 'number' ? number : string,
>({
  type = 'text' as Type,
  placeholder,
  value,
  onChange,
  ...rest
}: {
  type?: Type
  placeholder?: string
  value: ValueType
  onChange: (v: ValueType) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange((type === 'number' ? e.target.valueAsNumber : e.target.value) as ValueType)}
      {...rest}
    />
  )
}

export default Textfield
