"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal h-11 rounded-lg border-slate-200 shadow-sm",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "MMM dd, yyyy")} -{" "}
                                    {format(date.to, "MMM dd, yyyy")}
                                </>
                            ) : (
                                format(date.from, "MMM dd, yyyy")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 border-b border-border bg-slate-50/50">
                        <h4 className="font-medium text-sm text-foreground">Select Range</h4>
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={1}
                    />
                    <div className="flex items-center justify-between p-3 border-t border-border bg-slate-50/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground h-8 px-2"
                            onClick={() => setDate(undefined)}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary font-bold h-8 px-2 hover:bg-primary/10"
                            onClick={() => {
                                const today = new Date();
                                setDate({ from: today, to: today });
                            }}
                        >
                            Today
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
