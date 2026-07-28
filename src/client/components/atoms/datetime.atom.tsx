import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'

export const DEFAULT_FORMAT = 'YYYY/MM/DD HH:mm:ss'

const DatetimeInput = ({
  value = '',
  setValue,
  onChange,
  readonly = false,
  format = DEFAULT_FORMAT,
}: {
  value?: string
  setValue?: (v: string) => void
  onChange?: (v: string) => void
  readonly?: boolean
  format?: string
}) => {
  if (readonly) {
    return <span>{value ? dayjs(value).format(format) : '未設定'}</span>
  }

  const date = value ? dayjs(value).toDate() : null

  return (
    <DatePicker
      selected={date}
      onChange={(d: Date | null) => {
        const formattedDate = d && dayjs(d).isValid() ? dayjs(d).format(format) : ''
        onChange?.(formattedDate)
        setValue?.(formattedDate)
      }}
      dateFormat={format.replace(/Y/g, 'y').replace(/D/g, 'd')}
      showTimeSelect
      timeFormat="HH:mm:ss"
      timeIntervals={1}
      showTimeInput={false}
    />
  )
}

export default DatetimeInput
