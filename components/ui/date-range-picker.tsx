import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "./utils"

interface DateRange {
  from: Date
  to: Date
}

interface DatePickerWithRangeProps {
  selected?: DateRange
  onSelect?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePickerWithRange({
  selected,
  onSelect,
  placeholder = "Seleccionar fechas",
  className,
  disabled
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range) return placeholder
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    if (range.from && range.to) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`
    } else if (range.from) {
      return `Desde ${formatDate(range.from)}`
    }
    
    return placeholder
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(selected)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            selected={selected}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onSelect?.({ from: range.from, to: range.to })
                setIsOpen(false)
              } else if (range?.from && !range?.to) {
                // Allow selecting single date as start
                onSelect?.({ from: range.from, to: range.from })
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}