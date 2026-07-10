<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
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
        'name',
        'cpf',
    ];

    /**
     * Get the orders for the customer.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the customer's largest order.
     */
    public function largestOrder()
    {
        return $this->orders()->orderBy('total_amount', 'desc')->first();
    }

    /**
     * Get the customer's first order.
     */
    public function firstOrder()
    {
        return $this->orders()->orderBy('created_at', 'asc')->first();
    }

    /**
     * Get the customer's latest order.
     */
    public function latestOrder()
    {
        return $this->orders()->orderBy('created_at', 'desc')->first();
    }
}