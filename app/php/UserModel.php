<?php
class UserModel{
	private $steamid;
	private $personaname;
        private $avatar_url;
        private $avatar_medium_url;
        private $avatar_full_url;
        private $isPublic;
        private $friendsList = null;
        private $itemList = null;
        
        function __construct($steamid, $personaname, $avatar_url, $avatar_medium_url, $avatar_full_url, $isPublic) {
            $this->steamid = $steamid;
            $this->personaname = $personaname;
            $this->avatar_url = $avatar_url;
            $this->avatar_medium_url = $avatar_medium_url;
            $this->avatar_full_url = $avatar_full_url;
            $this->isPublic = $isPublic;
        }

        public function getSteamid() {
            return $this->steamid;
        }

        public function getPersonaname() {
            return $this->personaname;
        }

        public function getAvatar_url() {
            return $this->avatar_url;
        }

        public function getAvatar_medium_url() {
            return $this->avatar_medium_url;
        }
        
        public function isPublic() {
            return $this->isPublic;
        }
        
        /**
         * Lazy loading method to get friendslist.
         * @return type 
         */
        public function getFriendsList() {
            if($this->friendsList == null){
                require_once("SteamLink.php");
                $steamLink = new SteamLink();
                $this->friendsList = $steamLink->getFriendsList($this);
            }
            return $this->friendsList;
        }
		
		public function getFriendsListArray(){
			$array = array();
			foreach($this->getFriendsList() as $user){
				$array[] = $user->toArray();
			}
			return $array;
		}

        /**
         * Lazy loading method to get itemlist..
         * @return Array of items 
         */
        public function getItemList() {
            if($this->itemList == null){
                require_once("SteamLink.php");
                $steamLink = new SteamLink();
                $this->itemList = $steamLink->getPlayerInventory($this);
            }
            return $this->itemList;
        }
        
        public function toArray(){
            $array = array(
                "steamid" => $this->steamid,
                "personaname" => $this->personaname,
                "avatarurl" => $this->avatar_url,
                "avatarmediumurl" => $this->avatar_medium_url,
                "avatarfullurl" => $this->avatar_full_url,
                "ispublic" => $this->isPublic, 
            );
            return $array;
        }
}
?>