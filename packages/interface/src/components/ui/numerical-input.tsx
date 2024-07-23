"use client";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface NumericalInput
  extends React.InputHTMLAttributes<HTMLInputElement> {
  maxDecimal?: number;
  prependSymbol?: string;
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function isInputGreaterThanDecimals(
  value: string,
  maxDecimals?: number,
): boolean {
  const decimalGroups = value.split(".");

  if (maxDecimals === 0) {
    return decimalGroups.length > 1;
  }

  return (
    !!maxDecimals &&
    decimalGroups.length > 1 &&
    decimalGroups[1].length > maxDecimals
  );
}

const NumericalInput = React.forwardRef<HTMLInputElement, NumericalInput>(
  (
    {
      className,
      placeholder,
      maxDecimal,
      prependSymbol,
      onChange,
      type,
      ...props
    },
    ref,
  ) => {
    const enforcer = (
      nextUserInput: string,
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (
        nextUserInput === "" ||
        inputRegex.test(escapeRegExp(nextUserInput))
      ) {
        if (isInputGreaterThanDecimals(nextUserInput, maxDecimal)) {
          return;
        }

        if (onChange) {
          const transfomedEvent = event;
          event.target.value = nextUserInput;
          onChange(transfomedEvent);
        }
        return;
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        // text-specific options
        pattern="^[0-9]*[.,]?[0-9]*$"
        placeholder={placeholder || "0"}
        minLength={1}
        maxLength={79}
        spellCheck="false"
        onChange={(event) => {
          if (prependSymbol) {
            const value = event.target.value;

            // cut off prepended symbol
            const formattedValue = value.toString().includes(prependSymbol)
              ? value
                  .toString()
                  .slice(prependSymbol.length, value.toString().length + 1)
              : value;

            // replace commas with periods, because uniswap exclusively uses period as the decimal separator
            enforcer(formattedValue.replace(/,/g, "."), event);
          } else {
            enforcer(event.target.value.replace(/,/g, "."), event);
          }
        }}
        {...props}
      />
    );
  },
);
NumericalInput.displayName = "NumericalInput";

export { NumericalInput };
