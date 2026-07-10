<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory;

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'number',
        'status',
    ];

    /**
     * Get the orders for the table.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Check if the table is available.
     */
    public function isAvailable()
    {
        return $this->status === 'available';
    }
}