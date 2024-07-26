// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract BytePlayground {
    struct Post {
        string title;
        string content;
        bool isPublished;
    }
    struct MyComplexStruct {
        string valString; // the quick brown fox jumps over the lazy dog
        Post[] valPosts; // lorem:ipsum true ; sir:dolor false
        bool valBool; // true
        uint16 valUint; // 420
    }

    function getComplexStruct() public pure returns (MyComplexStruct memory) {
        Post memory post1 = Post("lorem", "ipsum", true);
        Post memory post2 = Post("sir", "dolor", false);
        Post[] memory posts = new Post[](2);
        posts[0] = post1;
        posts[1] = post2;
        MyComplexStruct memory complexStruct = MyComplexStruct(
            "the quick brown fox jumps over the lazy dog",
            posts,
            true,
            420
        );
        return complexStruct;
    }

    function convertComplexStructToBytes() public pure returns (bytes memory) {
        MyComplexStruct memory complexStruct = getComplexStruct();
        return abi.encode(complexStruct);
    }

    function convertBytesToComplexStruct(bytes memory _bytes)
        public
        pure
        returns (MyComplexStruct memory)
    {
        return abi.decode(_bytes, (MyComplexStruct));
    }

    function getComplextStructCycledFromBytes() public pure returns (MyComplexStruct memory) {
        bytes memory complexStructBytes = convertComplexStructToBytes();
        return convertBytesToComplexStruct(complexStructBytes);
    }
}
