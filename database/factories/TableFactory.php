<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Table>
 */
class TableFactory extends Factory
{
    public function definition(): array
    {
        return [
            'number' => $this->faker->unique()->numberBetween(1, 20),
            'status' => 'available',
        ];
    }
}
