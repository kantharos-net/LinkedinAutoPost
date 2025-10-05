"use client";

import * as React from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Form({ children, ...props }: React.ComponentProps<typeof FormProvider>) {
  return <FormProvider {...props}>{children}</FormProvider>;
}

export function FormField({ name, label, description, required, children, className }: FormFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name as never}
      control={control as never}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-1", className)}>
          {label && (
            <Label htmlFor={name}>
              {label}
              {required ? <span className="text-destructive"> *</span> : null}
            </Label>
          )}
          {typeof children === "function"
            ? (children as (field: typeof field, fieldState: typeof fieldState) => React.ReactNode)(field, fieldState)
            : React.cloneElement(children as React.ReactElement, {
                ...field,
                id: name,
                name,
                value: field.value ?? "",
                onChange: field.onChange,
                onBlur: field.onBlur,
                ref: field.ref
              })}
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          {fieldState.error ? (
            <p className="text-xs text-destructive">{fieldState.error.message}</p>
          ) : null}
        </div>
      )}
    />
  );
}
