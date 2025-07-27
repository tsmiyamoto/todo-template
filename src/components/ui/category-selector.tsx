"use client"

import { Check, ChevronsUpDown, Edit, MoreHorizontal, Plus, Trash2, X } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Category {
  id: number
  name: string
  color: string
}

interface CategorySelectorProps {
  categories: Category[]
  selectedCategories: number[]
  onCategoriesChange: (categoryIds: number[]) => void
  onCreateCategory: (name: string, color: string) => Promise<void>
  onUpdateCategory?: (id: number, name: string, color: string) => Promise<void>
  onDeleteCategory?: (id: number) => Promise<void>
  placeholder?: string
}

export function CategorySelector({
  categories,
  selectedCategories,
  onCategoriesChange,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  placeholder = "カテゴリを選択..."
}: CategorySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [newCategoryColor, setNewCategoryColor] = React.useState("#3b82f6")
  const [hoveredCategoryId, setHoveredCategoryId] = React.useState<number | null>(null)
  const [editMenuOpen, setEditMenuOpen] = React.useState<number | null>(null)
  const [editingCategoryId, setEditingCategoryId] = React.useState<number | null>(null)
  const [editingName, setEditingName] = React.useState("")
  const [editingColor, setEditingColor] = React.useState("")

  const selectedCategoryObjects = selectedCategories
    .map(id => categories.find(cat => cat.id === id))
    .filter(Boolean) as Category[]

  const availableCategories = categories.filter(
    cat => !selectedCategories.includes(cat.id)
  )

  const exactMatch = categories.find(
    cat => cat.name.toLowerCase() === inputValue.toLowerCase()
  )

  const showCreateOption = inputValue.trim() && !exactMatch

  const handleSelect = (categoryId: number) => {
    onCategoriesChange([...selectedCategories, categoryId])
    setInputValue("")
  }

  const handleRemove = (categoryId: number) => {
    onCategoriesChange(selectedCategories.filter(id => id !== categoryId))
  }

  const handleCreateNew = async () => {
    if (!inputValue.trim()) return
    
    try {
      await onCreateCategory(inputValue.trim(), newCategoryColor)
      setInputValue("")
      setNewCategoryColor("#3b82f6")
    } catch (error) {
      console.error("カテゴリ作成に失敗:", error)
    }
  }

  const handleEditStart = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditingName(category.name)
    setEditingColor(category.color)
    setEditMenuOpen(null)
  }

  const handleEditSave = async () => {
    if (!editingCategoryId || !onUpdateCategory) return
    
    try {
      await onUpdateCategory(editingCategoryId, editingName, editingColor)
      setEditingCategoryId(null)
      setEditingName("")
      setEditingColor("")
    } catch (error) {
      console.error("カテゴリ更新に失敗:", error)
    }
  }

  const handleEditCancel = () => {
    setEditingCategoryId(null)
    setEditingName("")
    setEditingColor("")
  }

  const handleDelete = async (categoryId: number) => {
    if (!onDeleteCategory) return
    
    try {
      await onDeleteCategory(categoryId)
      setEditMenuOpen(null)
      // 選択リストからも削除
      if (selectedCategories.includes(categoryId)) {
        onCategoriesChange(selectedCategories.filter(id => id !== categoryId))
      }
    } catch (error) {
      console.error("カテゴリ削除に失敗:", error)
    }
  }

  const handleColorChange = async (categoryId: number, newColor: string) => {
    if (!onUpdateCategory) return
    
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return
    
    try {
      await onUpdateCategory(categoryId, category.name, newColor)
      setEditMenuOpen(null)
    } catch (error) {
      console.error("カテゴリ色変更に失敗:", error)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">カテゴリ</label>
      
      {/* 選択済みカテゴリのバッジ表示 */}
      {selectedCategoryObjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategoryObjects.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="pr-1"
              style={{ 
                backgroundColor: category.color + "20", 
                color: category.color,
                borderColor: category.color + "40"
              }}
            >
              {category.name}
              <button
                type="button"
                onClick={() => handleRemove(category.id)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* カテゴリ選択Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full"
          >
            {selectedCategoryObjects.length > 0 
              ? `${selectedCategoryObjects.length}個のカテゴリが選択済み`
              : placeholder
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="カテゴリを検索または新規作成..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                カテゴリが見つかりません
              </CommandEmpty>
              
              {/* 既存カテゴリ */}
              {availableCategories.length > 0 && (
                <CommandGroup heading="既存のカテゴリ">
                  {availableCategories
                    .filter(category =>
                      category.name.toLowerCase().includes(inputValue.toLowerCase())
                    )
                    .map((category) => (
                      <div
                        key={category.id}
                        className="relative group"
                        onMouseEnter={() => setHoveredCategoryId(category.id)}
                        onMouseLeave={() => {
                          if (editMenuOpen !== category.id) {
                            setHoveredCategoryId(null)
                          }
                        }}
                      >
                        {editingCategoryId === category.id ? (
                          // 編集モード
                          <div className="flex items-center gap-2 p-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: editingColor }}
                            />
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 h-6 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave()
                                if (e.key === 'Escape') handleEditCancel()
                              }}
                            />
                            <input
                              type="color"
                              value={editingColor}
                              onChange={(e) => setEditingColor(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-0"
                            />
                            <Button size="sm" onClick={(e) => {
                              e.stopPropagation()
                              handleEditSave()
                            }} className="h-6 px-2">
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation()
                              handleEditCancel()
                            }} className="h-6 px-2">
                              ✕
                            </Button>
                          </div>
                        ) : (
                          // 通常モード
                          <CommandItem
                            value={category.name}
                            onSelect={() => handleSelect(category.id)}
                            className="flex items-center gap-2 pr-8"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="flex-1">{category.name}</span>
                            <Check className="ml-auto h-4 w-4 opacity-0" />
                            
                            {/* 3点リーダーボタン（ホバー時表示） */}
                            {(hoveredCategoryId === category.id || editMenuOpen === category.id) && (
                              <Popover open={editMenuOpen === category.id} onOpenChange={(open) => {
                                if (!open) {
                                  setEditMenuOpen(null)
                                  setHoveredCategoryId(null)
                                }
                              }}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditMenuOpen(category.id)
                                    }}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1" side="right" align="start">
                                  <div className="space-y-1">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start h-8 px-2 text-sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditStart(category)
                                      }}
                                    >
                                      <Edit className="mr-2 h-3 w-3" />
                                      名前を変更
                                    </Button>
                                    
                                    {/* カラーパレット */}
                                    <div className="px-2 py-1">
                                      <div className="text-xs text-gray-500 mb-1">色を変更</div>
                                      <div className="grid grid-cols-6 gap-1">
                                        {[
                                          '#ef4444', '#f97316', '#eab308', '#22c55e', 
                                          '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
                                        ].map((color) => (
                                          <button
                                            key={color}
                                            className="w-4 h-4 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleColorChange(category.id, color)
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start h-8 px-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(category.id)
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-3 w-3" />
                                      削除
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </CommandItem>
                        )}
                      </div>
                    ))}
                </CommandGroup>
              )}

              {/* 新規作成オプション */}
              {showCreateOption && (
                <CommandGroup heading="新規作成">
                  <CommandItem
                    value={`create-${inputValue}`}
                    onSelect={() => handleCreateNew()}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Plus className="h-4 w-4" />
                      <span>「{inputValue}」を作成</span>
                    </div>
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-6 h-6 rounded border-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
} 