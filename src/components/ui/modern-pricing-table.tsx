"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Star } from "lucide-react"

// Individual Digit Animation Component
const AnimatedDigit: React.FC<{ digit: string; index: number }> = ({ digit, index }) => {
    return (
        <div className="relative overflow-hidden inline-block min-w-[1ch] text-center">
            <AnimatePresence mode="wait">
                <motion.span
                    key={digit}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: [0.4, 0, 0.2, 1]
                    }}
                    className="block"
                >
                    {digit}
                </motion.span>
            </AnimatePresence>
        </div>
    )
}

// Enhanced Scrolling Number Component with individual digit animations
const ScrollingNumber: React.FC<{ value: number }> = ({ value }) => {
    const numberString = (value || 0).toString()

    return (
        <div className="flex items-center">
            {numberString.split('').map((digit, index) => (
                <AnimatedDigit
                    key={`${value}-${index}`}
                    digit={digit}
                    index={index}
                />
            ))}
        </div>
    )
}

export interface Plan {
    title: string
    price: {
        monthly: number
        quarterly: number
        yearly: number
    }
    description: string
    features: string[]
    ctaText: string
    ctaHref: string
    isFeatured?: boolean
    disabled?: boolean
}

interface PricingTableProps {
    plans: Plan[]
    interval: "monthly" | "quarterly" | "yearly"
}

const PricingTable: React.FC<PricingTableProps> = ({ plans, interval }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1
        }
    }

    const getPriceValue = (plan: Plan) => {
        if (interval === 'monthly') return plan.price.monthly;
        if (interval === 'quarterly') return plan.price.quarterly;
        return plan.price.yearly;
    }

    const getIntervalLabel = () => {
        if (interval === 'monthly') return '/month';
        if (interval === 'quarterly') return '/quarter';
        return '/year';
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-16">
            <motion.div
                className={`grid grid-cols-1 gap-6 ${plans.length === 1 ? 'max-w-md mx-auto' : plans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4'}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.title}
                        variants={cardVariants}
                        className="relative"
                    >
                        {plan.isFeatured && !plan.disabled && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                                className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                            >
                                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg whitespace-nowrap">
                                    <Star className="size-3 fill-current" />
                                    {plan.title === 'Organization' ? 'Institutional' : 'Most Popular'}
                                </div>
                            </motion.div>
                        )}

                        <div className={`
              relative h-full p-8 rounded-[32px] border transition-all duration-300
              ${plan.isFeatured
                                ? 'border-primary/50 bg-primary/[0.03] shadow-2xl shadow-primary/5'
                                : 'border-border bg-card/50 shadow-sm'
                            }
            `}>
                            <div className="text-center space-y-4 mb-8">
                                <h3 className="text-2xl font-black text-foreground">{plan.title}</h3>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{plan.description}</p>
 
                                <div className="space-y-2">
                                    <div className="text-4xl font-black text-foreground flex items-center justify-center tracking-tighter">
                                        ₹<ScrollingNumber value={getPriceValue(plan)} />
                                        <span className="text-base text-muted-foreground font-bold ml-1">
                                            {getIntervalLabel()}
                                        </span>
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-muted-foreground font-bold uppercase tracking-widest"
                                    >
                                        <span>Billed {interval}</span>
                                    </motion.div>
                                </div>
                            </div>
 
                            <div className="space-y-4 mb-8">
                                {plan.features.map((feature, featureIndex) => (
                                    <motion.div
                                        key={feature}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + index * 0.1 + featureIndex * 0.05 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="flex-shrink-0 size-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Check className="size-3 text-primary" />
                                        </div>
                                        <span className="text-sm text-foreground/90 font-medium">{feature}</span>
                                    </motion.div>
                                ))}
                            </div>
 
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                            >
                                <Button
                                    asChild={!plan.disabled}
                                    variant={plan.isFeatured ? "default" : "outline"}
                                    size="lg"
                                    className={`w-full h-14 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.isFeatured ? 'shadow-xl shadow-primary/20' : 'border-border hover:bg-muted'}`}
                                    disabled={plan.disabled}
                                >
                                    {plan.disabled ? (
                                        <span>{plan.ctaText}</span>
                                    ) : (
                                        <a href={plan.ctaHref}>
                                            {plan.ctaText}
                                        </a>
                                    )}
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    )
}

export default PricingTable
