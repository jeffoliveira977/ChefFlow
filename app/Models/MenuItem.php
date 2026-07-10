<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasFactory;

    protected $hidden = [
        'created_at',
        'updated_at',
        'category_id',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'category_id',
        'available',
        'preparation_time',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'available' => 'boolean',
        'preparation_time' => 'integer',
    ];

    /**
     * Get the category that owns the menu item.
     */
    public function category()
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    /**
     * Get the order items for the menu item.
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}