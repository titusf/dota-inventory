<?php
class ItemModel{
	private $defindex;
	private $name;
        private $description;
	private $image_url;
	private $item_rarity;
        private $item_class;
        private $item_type_name;
        private $hero;
	
	function __construct($defindex, $name, $description, $image_url, $item_rarity, $hero, $item_type_name, $item_class){
		$this->defindex = $defindex;
		$this->name = $name;
		$this->image_url = $image_url;
		$this->item_rarity = $item_rarity;
                $this->description = $description;
                $this->hero = $hero;
                $this->item_type_name = $item_type_name;
                $this->item_class = $item_class;
	}
        
        public function getDefindex() {
            return $this->defindex;
        }

        public function getName() {
            return $this->name;
        }

        public function getImage_url() {
            return $this->image_url;
        }

        public function getItem_rarity() {
            return $this->item_rarity;
        }
        
        public function getDescription() {
            return $this->description;
        }
        
        public function toArray(){
            $array = array(
                "defindex" => $this->defindex,
                "name" => $this->name,
                "description" => $this->description,
                "image_url" => $this->image_url,
                "item_rarity" => $this->item_rarity,
                "used_by_heroes" => $this->hero,
                "item_type_name" => $this->item_type_name,
                "item_class" => $this->item_class,
            );
            return $array;
        }

}
?>